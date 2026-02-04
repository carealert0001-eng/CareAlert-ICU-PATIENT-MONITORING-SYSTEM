from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash
from flask_bcrypt import Bcrypt
import mysql.connector
import requests

app = Flask(__name__)
app.secret_key = "carealert_secret_key"
bcrypt = Bcrypt(app)

BLYNK_TOKEN = "g5T9QmHh4Kky-1EkUJbCEFr5RiTXGsGo"
BLYNK_URL = "https://blynk.cloud/external/api/get"

def get_blynk_data(pin):
    url = f"{BLYNK_URL}?token={BLYNK_TOKEN}&{pin}"
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.text

# ------------------ DATABASE ------------------
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Okmysqlpass@12",
        database="carealert"
    )

# ------------------ PAGES ------------------
@app.route("/")
def about_page():
    return render_template("about_final.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html")

# ------------------ REGISTER ------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        full_name = request.form.get("full_name")

        #full_name = request.form["full_name"]
        email = request.form["email"]
        phone = request.form["phone"]
        role = request.form["role"]
        specialization = request.form.get("specialization")
        department = request.form.get("department")
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            flash("Passwords do not match")
            return redirect(url_for("register"))

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        conn = get_db()
        cursor = conn.cursor()


        full_name = request.form.get("full_name", "").strip()

        if not full_name:
            flash("Full name is required")
            return redirect(url_for("register"))
        


        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            flash("Email already registered. Please login.")
            cursor.close()
            conn.close()
            return redirect(url_for("login_page"))

        cursor.execute("""
            INSERT INTO users
            (full_name, email, password_hash, phone, specialization, department, role)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            full_name,
            email,
            password_hash,
            phone,
            specialization,
            department,
            role
        ))

        conn.commit()
        cursor.close()
        conn.close()

        flash("Registration successful! Please login.")
        return redirect(url_for("login_page"))

    return render_template("register.html")

# ------------------ LOGIN ------------------
@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        email = request.form["username"]
        password = request.form["password"]

        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and bcrypt.check_password_hash(user["password_hash"], password):
            session["user_id"] = user["id"]
            session["role"] = user["role"]
            return redirect(url_for("dashboard"))

        flash("Invalid credentials")
        return redirect(url_for("login_page"))

    return render_template("login.html")

# ------------------ LOGOUT ------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

@app.route("/api/data")
def fetch_blynk_data():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = {
            "heart_rate": float(get_blynk_data("V0")),
            "spo2": float(get_blynk_data("V1")),
            "temperature": float(get_blynk_data("V2"))
        }
    except:
        data = {
            "heart_rate": 0,
            "spo2": 0,
            "temperature": 0
        }

    return jsonify(data)

#--------------Add data in mysql-------------

def save_readings(hr, spo2, temp):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO readings (heart_rate, spo2, temperature)
        VALUES (%s, %s, %s)
    """, (hr, spo2, temp))

    conn.commit()
    cursor.close()
    conn.close()


# ------------------ RUN ------------------
if __name__ == "__main__":
    app.run(debug=True)