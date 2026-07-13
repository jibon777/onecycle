pipeline {
    agent any

    environment {
        SCANNER_HOME = tool 'SonarQubeScanner' // Nama scanner di Jenkins Global Tool Configuration
        DOCKER_REGISTRY = 'registry.hub.docker.com'
        IMAGE_NAME = 'username-docker-kamu/node-login-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Cloning Code') {
            steps {
                echo 'Mengambil kode terbaru dari repository...'
                // Biasanya otomatis di Jenkins jika menggunakan multibranch/webhook
            }
        }

        stage('SonarQube Code Analysis') {
            steps {
                script {
                    // Jalankan analisis SonarQube
                    withSonarQubeEnv('SonarQubeServer') { // Nama server di Jenkins System Configuration
                        sh "${SCANNER_HOME}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    // Menunggu hasil evaluasi dari SonarQube (Lolos/Gagal)
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Membuat Docker Image untuk Production...'
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Push Image to Registry') {
            steps {
                script {
                    // Pastikan credential 'docker-hub-credentials' sudah dibuat di Jenkins
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'PASSWORD', usernameVariable: 'USERNAME')]) {
                        sh "echo \$PASSWORD | docker login -u \$USERNAME --password-stdin ${DOCKER_REGISTRY}"
                        sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push ${IMAGE_NAME}:latest"
                    }
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                echo 'Melakukan deployment ke server Production...'
                // Simulasi deploy menggunakan docker-compose di server production
                // Di dunia nyata, Anda bisa menggunakan SSH Agent untuk remote server, atau Kubernetes (kubectl)
                sh "docker compose down"
                sh "docker compose up -d"
                echo 'Aplikasi berhasil diperbarui di Production!'
            }
        }
    }

    post {
        always {
            echo 'Membersihkan sisa build lama...'
            sh "docker image prune -f"
        }
        success {
            echo 'Pipeline selesai dengan sukses! Aplikasi siap digunakan.'
        }
        failure {
            echo 'Pipeline gagal. Silakan periksa log di atas atau laporan SonarQube.'
        }
    }
}
