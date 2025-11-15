# CEK Tracing - CSV BTT Tracker

Aplikasi web untuk tracking BTT (nomor resi) secara massal menggunakan upload file CSV. Aplikasi ini mengintegrasikan API Dakota Cargo untuk mendapatkan informasi tracking terkini dari setiap BTT.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-4.25+-000000?logo=fastify&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

## Features

- **Upload CSV** - Upload file CSV berisi daftar BTT untuk tracking massal
- **Auto Tracking** - Otomatis melakukan tracking setiap BTT melalui API Dakota Cargo
- **Real-time Progress** - Menampilkan progress bar dan status tracking secara real-time
- **Interactive Table** - Hasil tracking ditampilkan dalam tabel interaktif dengan status badge
- **Export CSV** - Export hasil tracking ke file CSV untuk dokumentasi
- **Responsive Design** - Tampilan modern dan responsive
- **Docker Support** - Siap deploy menggunakan Docker dan Docker Compose

## Demo

### Screenshot
![CEK Tracing Interface](https://via.placeholder.com/800x400/667eea/ffffff?text=CEK+Tracing+Interface)

### Status Badge
- 🟢 **DELIVERED** - Paket sudah diterima
- 🟡 **ON PROCESS** - Paket dalam proses pengiriman
- 🔴 **ERROR** - Terjadi kesalahan saat tracking

## Tech Stack

- **Backend**: Node.js + Fastify
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API Integration**: Dakota Cargo Tracking API
- **Containerization**: Docker & Docker Compose

## Prerequisites

Sebelum menjalankan aplikasi, pastikan Anda telah menginstall:

- [Node.js](https://nodejs.org/) v18 atau lebih tinggi
- [npm](https://www.npmjs.com/) (biasanya sudah termasuk dengan Node.js)
- [Docker](https://www.docker.com/) (opsional, untuk deployment dengan Docker)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/stereochorus/cekbttbycsv.git
cd cekbttbycsv
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Application

```bash
npm start
```

Aplikasi akan berjalan di: `http://localhost:3000`

## Docker Deployment

### Menggunakan Docker Compose (Recommended)

```bash
# Build dan jalankan container
docker-compose up -d

# Lihat logs
docker-compose logs -f

# Stop container
docker-compose down
```

### Menggunakan Docker

```bash
# Build image
docker build -t cektracing .

# Run container
docker run -d -p 3000:3000 --name cektracing-app cektracing

# Lihat logs
docker logs -f cektracing-app

# Stop container
docker stop cektracing-app
```

## Usage

### 1. Siapkan File CSV

Format CSV yang didukung:

```csv
BTT
1234567890
0987654321
1122334455
```

Atau dengan header custom:

```csv
NO,BTT
1,1234567890
2,0987654321
3,1122334455
```

### 2. Upload dan Track

1. Buka aplikasi di browser: `http://localhost:3000`
2. Klik **"Choose File"** dan pilih file CSV Anda
3. Klik tombol **"Proses CSV"**
4. Tunggu hingga proses tracking selesai
5. Hasil akan ditampilkan dalam tabel

### 3. Export Hasil

Setelah tracking selesai, klik tombol **"Export ke CSV"** untuk mengunduh hasil tracking.

## API Endpoints

### Health Check
```
GET /api/health
```
Response:
```json
{
  "status": "OK",
  "message": "Server berjalan dengan baik"
}
```

### Tracking BTT
```
GET /api/trace?b={BTT_NUMBER}
```
Parameter:
- `b` - Nomor BTT yang akan di-track

Response:
```json
{
  "detail": {
    "tanggal": "2025-11-15 10:30:00",
    "keterangan": "Paket telah diterima",
    "posisi": "Jakarta",
    "status": "DELIVERED"
  }
}
```

## Project Structure

```
cekbttbycsv/
├── index.html              # Frontend interface
├── server.js               # Fastify server & API proxy
├── package.json            # Dependencies & scripts
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore           # Docker ignore rules
├── .gitignore              # Git ignore rules
└── README.md               # Documentation
```

## Configuration

### Port Configuration

Default port adalah `3000`. Untuk mengubah port, edit file `server.js`:

```javascript
await fastify.listen({ port: 3000, host: '0.0.0.0' });
```

### API Configuration

Aplikasi menggunakan API Dakota Cargo. Endpoint API dapat diubah di `server.js`:

```javascript
const apiUrl = `https://dakotacargo.co.id/api/tracelastonly/?b=${encodeURIComponent(b)}`;
```

## Development

### Run in Development Mode

```bash
npm run dev
```

### Scripts

- `npm start` - Menjalankan aplikasi dalam production mode
- `npm run dev` - Menjalankan aplikasi dalam development mode

## Troubleshooting

### Port Sudah Digunakan

Jika port 3000 sudah digunakan, ubah port di `server.js` atau kill process yang menggunakan port tersebut:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### CORS Error

Aplikasi sudah dikonfigurasi dengan CORS yang permisif. Jika masih ada masalah, periksa konfigurasi CORS di `server.js`.

### API Timeout

Jika API timeout, periksa koneksi internet dan pastikan API Dakota Cargo dapat diakses.

## Contributing

Kontribusi selalu diterima! Silakan:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

Distributed under the ISC License. See `LICENSE` for more information.

## Contact

Repository: [https://github.com/stereochorus/cekbttbycsv](https://github.com/stereochorus/cekbttbycsv)

## Acknowledgments

- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Dakota Cargo](https://dakotacargo.co.id/) - Tracking API provider
- [Node Fetch](https://github.com/node-fetch/node-fetch) - HTTP client

---

⭐ Jangan lupa berikan star jika project ini membantu Anda!
