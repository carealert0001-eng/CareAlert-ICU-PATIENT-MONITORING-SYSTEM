from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash
from flask_bcrypt import Bcrypt
import mysql.connector
import requests
import threading
import time

app = Flask(__name__)
app.secret_key = "carealert_secret_key"
bcrypt = Bcrypt(app)

# ------------------ BLYNK CONFIG ------------------
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
        database="carealert2"
    )

# ------------------ PATIENT HANDLING ------------------
def get_or_create_patient_id():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Try existing patient
    cursor.execute("SELECT id FROM patients LIMIT 1")
    row = cursor.fetchone()

    if row:
        cursor.close()
        conn.close()
        return row[0]

    # 2. Get any user
    cursor.execute("SELECT id FROM users LIMIT 1")
    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()
        print("No user found. Waiting...")
        return None

    user_id = user[0]

    # 3. Auto-create patient
    cursor.execute("""
        INSERT INTO patients (user_id, device_token)
        VALUES (%s, %s)
    """, (user_id, "AUTO_DEVICE_001"))

    conn.commit()

    cursor.execute("SELECT id FROM patients LIMIT 1")
    patient_id = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print(f"[AUTO] Patient created with ID {patient_id}")
    return patient_id

# ------------------ SAVE READINGS ------------------
def save_readings(hr, spo2, temp):
    patient_id = get_or_create_patient_id()
    if not patient_id:
        print("No patient found in DB. Waiting...")
        return

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO readings (patient_id, heart_rate, spo2, temperature)
        VALUES (%s, %s, %s, %s)
    """, (patient_id, hr, spo2, temp))

    conn.commit()
    cursor.close()
    conn.close()

    print(f"[SAVED] Patient:{patient_id} HR:{hr} SpO2:{spo2} Temp:{temp}")

# ------------------ BACKGROUND TASK ------------------
def blynk_data_scheduler():
    while True:
        try:
            hr = float(get_blynk_data("V0"))
            spo2 = float(get_blynk_data("V1"))
            temp = float(get_blynk_data("V2"))

            save_readings(hr, spo2, temp)

        except Exception as e:
            print("Error saving Blynk data:", e)

        time.sleep(10)

# ------------------ PAGES ------------------
@app.route("/")
def about_page():
    return render_template("about_final.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login_page"))
    return render_template("dashboard.html")

# ------------------ REGISTER ------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        full_name = request.form.get("full_name", "")
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

        cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cursor.fetchone():
            flash("Email already registered")
            cursor.close()
            conn.close()
            return redirect(url_for("login_page"))

        cursor.execute("""
            INSERT INTO users (full_name, email, password_hash, phone, specialization, department, role)
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

        flash("Registration successful")
        return redirect(url_for("login_page"))

    return render_template("register.html")

#------------------Profile------------------
@app.route("/api/profile")
def profile_api():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT full_name, specialization, department, role
        FROM users
        WHERE id = %s
    """, (session["user_id"],))

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    return jsonify(user)


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

# ------------------ API FOR LIVE DATA ------------------
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
        data = {"heart_rate": 0, "spo2": 0, "temperature": 0}

    return jsonify(data)

# ------------------ RUN ------------------
if __name__ == "__main__":
    t = threading.Thread(target=blynk_data_scheduler)
    t.daemon = True
    t.start()

    app.run(debug=True, use_reloader=False)
