// Enhanced Dashboard JavaScript

let hrChart, spo2Chart, tempChart, distributionChart;
let hrData = [], spo2Data = [], tempData = [];
const maxDataPoints = 20;

function initCharts() {
    const hrCtx = document.getElementById('hrChart');
    const spo2Ctx = document.getElementById('spo2Chart');
    const tempCtx = document.getElementById('tempChart');
    const distributionCtx = document.getElementById('distributionChart');
    
    // Heart Rate Chart
    hrChart = new Chart(hrCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: maxDataPoints}, (_, i) => `${i+1}`),
            datasets: [{
                label: 'Heart Rate (BPM)',
                data: [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#0ea5e9',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b'
                    }
                },
                y: {
                    min: 50,
                    max: 120,
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)'
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return value + ' BPM';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
    
    // Oxygen Chart
    spo2Chart = new Chart(spo2Ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: maxDataPoints}, (_, i) => `${i+1}`),
            datasets: [{
                label: 'SpO₂ (%)',
                data: [],
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#0ea5e9',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(30, 41, 59, 0.9)'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b'
                    }
                },
                y: {
                    min: 85,
                    max: 100,
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)'
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    
    // Temperature Chart
    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Temperature (°C)',
                data: [36.5, 36.7, 36.8, 37.1, 37.3, 37.2, 37.0],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    min: 35,
                    max: 40
                }
            }
        }
    });
    
    // Distribution Chart
    distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Normal', 'Warning', 'Critical'],
            datasets: [{
                data: [65, 20, 15],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        }
    });
}

// Update real-time clock
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
    
    // Update last updated time
    const lastUpdate = document.getElementById('lastUpdate');
    const minutes = now.getMinutes();
    lastUpdate.textContent = `${minutes} minutes ago`;
}

// Fetch data from Flask API
async function fetchPatientData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        processData(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        // Use mock data if API fails
        processData({
            heart_rate: Math.floor(Math.random() * 30) + 70,
            spo2: Math.floor(Math.random() * 5) + 95,
            temperature: (Math.random() * 1 + 36.5).toFixed(1)
        });
    }
}

function processData(data) {
    const hrValue = parseFloat(data.heart_rate) || 0;
    const spo2Value = parseFloat(data.spo2) || 0;
    const tempValue = parseFloat(data.temperature) || 0;
    
    // Update metric values
    document.getElementById('hrValue').textContent = hrValue;
    document.getElementById('spo2Value').textContent = spo2Value;
    document.getElementById('tempValue').textContent = tempValue;
    
    // Update risk assessment based on vitals
    updateRiskAssessment(hrValue, spo2Value, tempValue);
    
    // Update chart data
    updateChartData(hrChart, hrValue);
    updateChartData(spo2Chart, spo2Value);
    
    // Update alerts
    checkAlerts(hrValue, spo2Value, tempValue);
    
    // Animate metric cards if values change significantly
    animateMetricChanges(hrValue, spo2Value, tempValue);
}

function updateChartData(chart, newValue) {
    if (chart.data.datasets[0].data.length >= maxDataPoints) {
        chart.data.datasets[0].data.shift();
    }
    chart.data.datasets[0].data.push(newValue);
    chart.update('none');
}

function updateRiskAssessment(hr, spo2, temp) {
    const riskElement = document.getElementById('riskValue');
    const riskProgress = document.querySelector('.progress-fill.critical');
    
    let riskScore = 0;
    
    // Calculate risk based on vitals
    if (hr < 60 || hr > 100) riskScore += 40;
    else if (hr < 65 || hr > 95) riskScore += 20;
    
    if (spo2 < 90) riskScore += 40;
    else if (spo2 < 95) riskScore += 20;
    
    if (temp < 35 || temp > 38.5) riskScore += 40;
    else if (temp < 36 || temp > 38) riskScore += 20;
    
    // Update risk display
    if (riskScore >= 80) {
        riskElement.textContent = 'CRITICAL';
        riskElement.style.color = '#ef4444';
        riskProgress.style.width = '95%';
    } else if (riskScore >= 50) {
        riskElement.textContent = 'HIGH';
        riskElement.style.color = '#f59e0b';
        riskProgress.style.width = '70%';
    } else if (riskScore >= 20) {
        riskElement.textContent = 'MODERATE';
        riskElement.style.color = '#3b82f6';
        riskProgress.style.width = '40%';
    } else {
        riskElement.textContent = 'LOW';
        riskElement.style.color = '#10b981';
        riskProgress.style.width = '20%';
    }
}

function checkAlerts(hr, spo2, temp) {
    const alertsContainer = document.getElementById('alertsList');
    alertsContainer.innerHTML = '';
    
    const alerts = [];
    
    // Critical alerts
    if (hr < 50) alerts.push({type: 'critical', title: 'Critical Bradycardia', desc: `Heart rate dangerously low at ${hr} BPM`, time: 'Just now'});
    if (hr > 130) alerts.push({type: 'critical', title: 'Critical Tachycardia', desc: `Heart rate dangerously high at ${hr} BPM`, time: 'Just now'});
    if (spo2 < 88) alerts.push({type: 'critical', title: 'Severe Hypoxia', desc: `Oxygen level critically low at ${spo2}%`, time: 'Just now'});
    if (temp > 39.5) alerts.push({type: 'critical', title: 'Hyperthermia', desc: `Body temperature dangerously high at ${temp}°C`, time: 'Just now'});
    
    // Warning alerts
    if (hr < 60 && hr >= 50) alerts.push({type: 'warning', title: 'Low Heart Rate', desc: `Heart rate below normal at ${hr} BPM`, time: '2 min ago'});
    if (hr > 100 && hr <= 130) alerts.push({type: 'warning', title: 'High Heart Rate', desc: `Heart rate above normal at ${hr} BPM`, time: '2 min ago'});
    if (spo2 < 95 && spo2 >= 88) alerts.push({type: 'warning', title: 'Low Oxygen', desc: `Oxygen level below normal at ${spo2}%`, time: '2 min ago'});
    if (temp > 38 && temp <= 39.5) alerts.push({type: 'warning', title: 'Elevated Temperature', desc: `Body temperature elevated at ${temp}°C`, time: '2 min ago'});
    
    // Info alerts
    if (alerts.length === 0) {
        alerts.push({type: 'info', title: 'All Systems Normal', desc: 'All vital signs within normal range', time: 'Just now'});
    }
    
    // Display alerts
    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item ${alert.type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${alert.type === 'critical' ? 'exclamation-triangle' : alert.type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-desc">${alert.desc}</div>
            </div>
            <div class="alert-time">${alert.time}</div>
        `;
        alertsContainer.appendChild(alertDiv);
    });
}

function animateMetricChanges(hr, spo2, temp) {
    // Add animation class to metrics if values are critical
    const hrCard = document.querySelector('.metric-card.heart-rate');
    const spo2Card = document.querySelector('.metric-card.oxygen');
    const tempCard = document.querySelector('.metric-card.temperature');
    
    if (hr < 60 || hr > 100) {
        hrCard.classList.add('pulse');
    } else {
        hrCard.classList.remove('pulse');
    }
    
    if (spo2 < 95) {
        spo2Card.classList.add('pulse');
    } else {
        spo2Card.classList.remove('pulse');
    }
    
    if (temp > 38) {
        tempCard.classList.add('pulse');
    } else {
        tempCard.classList.remove('pulse');
    }
}

// Time control buttons
function initTimeControls() {
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            timeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Here you would update chart data based on selected time range
            // For now, we'll just simulate it
            console.log(`Time range changed to: ${this.textContent}`);
        });
    });
}

// Emergency button functionality
function initEmergencyButton() {
    const emergencyBtn = document.getElementById('emergencyBtn');
    emergencyBtn.addEventListener('click', function() {
        // Create emergency modal or action
        showEmergencyModal();
    });
}

function showEmergencyModal() {
    const modal = document.createElement('div');
    modal.className = 'emergency-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-exclamation-triangle"></i> Emergency Actions</h3>
            <div class="emergency-actions">
                <button class="action-btn critical">
                    <i class="fas fa-phone-alt"></i>
                    Call Emergency
                </button>
                <button class="action-btn warning">
                    <i class="fas fa-user-md"></i>
                    Alert Doctor
                </button>
                <button class="action-btn info">
                    <i class="fas fa-file-medical"></i>
                    Quick Report
                </button>
            </div>
            <button class="close-btn">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles for modal
    const style = document.createElement('style');
    style.textContent = `
        .emergency-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
            animation: slideUp 0.3s ease;
        }
        
        .emergency-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 20px 0;
        }
        
        .action-btn {
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
        }
        
        .action-btn.critical {
            background: #ef4444;
            color: white;
        }
        
        .action-btn.warning {
            background: #f59e0b;
            color: white;
        }
        
        .action-btn.info {
            background: #3b82f6;
            color: white;
        }
        
        .close-btn {
            width: 100%;
            padding: 12px;
            background: #64748b;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    
    document.head.appendChild(style);
    
    // Close modal functionality
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('close-btn')) {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        }
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    initTimeControls();
    initEmergencyButton();
    
    // Start real-time updates
    fetchPatientData();
    updateClock();
    
    // Update data every 3 seconds
    setInterval(fetchPatientData, 3000);
    
    // Update clock every second
    setInterval(updateClock, 1000);
    
    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});