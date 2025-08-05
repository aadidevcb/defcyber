# HACKSKY DEFCYBER

A comprehensive cybersecurity defense system featuring real-time memory monitoring, intelligent firewall management, automated backup systems, and a sophisticated web-based dashboard for system administration.

## 🚀 Features

### Core Security Components
- ✅ **Continuous Memory Monitoring** - Advanced ELF binary integrity checking with SHA256 hash verification
- ✅ **Intelligent Firewall Control** - Dynamic iptables management with lockdown capabilities  
- ✅ **Automated Backup System** - Weekly backup scheduling with integrity preservation
- ✅ **Hash Verification System** - Real-time file integrity monitoring and validation
- ✅ **System Manager** - Centralized process and security orchestration
- ✅ **Multi-Level Authentication** - Secure API authentication with JWT tokens
- ✅ **Application Redundancy** - Dockerized deployment for high availability

### Web Dashboard
- ✅ **Real-time Memory Analytics** - Live visualization of memory check cycles and threat detection
- ✅ **Firewall Status Monitor** - Port monitoring and network traffic analysis
- ✅ **Backup Management** - Backup size tracking and copy management
- ✅ **Owner Authentication** - AES-protected cloud database authentication for privileged operations
- ✅ **Containerized Deployment** - Full Docker orchestration for rapid deployment

### User Interface
- ✅ **Modern Web Design** - Responsive UI with real-time data visualization
- ✅ **Multi-Section Dashboard** - Organized views for different security domains
- ✅ **Secure Authentication** - Owner-level authentication system
- ✅ **Lockdown Interface** - Emergency lockdown controls with visual feedback

## 🏗️ Architecture

### Backend (Django + GraphQL)
- **Framework**: Django with Strawberry GraphQL
- **Authentication**: JWT-based API authentication
- **Database**: Django ORM with user and hash management
- **APIs**: RESTful endpoints and GraphQL queries for real-time data

### Frontend (Next.js)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom animations
- **Charts**: Chart.js and Recharts for data visualization
- **UI Components**: Radix UI components with custom theming

### Security Layer (C++ Binaries)
- **Memory Monitor**: `memchecker.cpp` - Advanced ptrace-based memory analysis
- **Firewall Control**: `firewall.cpp` - iptables management with lockdown modes
- **Backup System**: `backup.cpp` - Automated file backup with versioning
- **Legacy Process**: `legacy.cpp` - Protected binary for integrity testing

## 📦 Installation & Deployment

### Prerequisites
- Docker and Docker Compose
- Linux environment with iptables support
- Root privileges for system-level operations

### Quick Start
```bash
# Clone the repository
git clone https://github.com/aadidevcb/defcyber.git
cd defcyber

# Build the complete system
docker-compose build

# Start the complete system
docker-compose up -d
```

### Manual Setup
```bash
# Security layer setup
cd security
g++ -o mem_check memchecker.cpp -lssl -lcrypto
g++ -o firewall firewall.cpp
g++ -o backup backup.cpp
g++ -o legacy legacy.cpp

# Backend setup
cd ../backend
pip install -r requirements.txt
python manage.py makegrations
python manage.py migrate
python manage.py runserver

# Frontend setup
cd ../frontend
npm install
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables
```bash
# Backend
DJANGO_SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# Frontend  
NEXT_PUBLIC_API_URL=http://localhost:8000/graphql/
```

### Security Configuration
- **Firewall Rules**: Configure allowed ports in `manager.py`
- **Memory Monitoring**: Set hash verification paths in `memchecker.cpp`
- **Backup Schedule**: Modify backup intervals in `backup.cpp`

## 🖥️ Usage

### Web Dashboard
1. Navigate to `http://localhost:3000`
2. Authenticate with user credentials
3. Monitor real-time security metrics
4. Access owner-level controls at `http://localhost:8000/admin`

### Security Operations
```bash
# Firewall control
./firewall normal    # Enable normal operations
./firewall shutdown  # Emergency lockdown
./firewall show      # Display open ports

# Memory monitoring
./mem_check          # Start continuous monitoring

# Backup operations  
./backup             # Start backup daemon
```

### API Endpoints
- **Authentication**: `POST /api/token/`
- **GraphQL**: `POST /graphql/`
- **Admin Panel**: `/admin/`

## 📊 Monitoring & Alerts

### Real-time Metrics
- Memory integrity status with hash verification
- Network traffic monitoring (upload/download rates)
- Open port detection and analysis
- Backup status and storage utilization

### Alert System
- Memory corruption detection
- Unauthorized port access
- Network anomaly detection
- System lockdown notifications

## 🔒 Security Features

### Authentication Layers
1. **User Authentication**: JWT-based API access
2. **Owner Authentication**: AES-encrypted privileged access
3. **System Authentication**: Hash-based binary verification

### Threat Detection
- **Memory Tampering**: SHA256 hash comparison of running processes
- **Network Intrusion**: Traffic pattern analysis and port monitoring
- **File Integrity**: Continuous backup verification and restoration

### Emergency Response
- **Automatic Lockdown**: Network isolation on threat detection
- **Manual Override**: Owner-level emergency controls  
- **System Recovery**: Automated backup restoration

## 🐳 Docker Support

Complete containerization for:
- Security monitoring services
- Django backend API
- Database management
- Shared volume management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement security enhancements
4. Test with provided Docker environment
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security Disclaimer

This system is designed for educational and authorized security testing purposes. Ensure proper authorization before deploying in production environments.

---

**HACKSKY DEFCYBER** - Advanced cybersecurity defense through intelligent monitoring and automated threat response.
