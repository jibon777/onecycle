pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.hub.docker.com'
        IMAGE_NAME = 'username-docker-kamu/node-login-app' // Ganti dengan username Docker Hub Anda
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Cloning Code') {
            steps {
                echo 'Mengambil kode terbaru dari repository...'
            }
        }

        stage('SonarQube Code Analysis') {
            steps {
                script {
                    // Berjalan secara ephemeral memanfaatkan image resmi Sonar Scanner via Docker
                    withSonarQubeEnv('SonarQubeServer') {
                        // Menggunakan jaringan 'ci-network' agar container scanner bisa mendeteksi server sonarqube-ci
                        docker.image('sonarsource/sonar-scanner-cli:latest').inside('--network=ci-network') {
                            sh 'sonar-scanner'
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    // Menunggu konfirmasi kelulusan kode dari SonarQube selama maks 5 menit
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
                    // Menggunakan kredensial Docker Hub yang tersimpan di Jenkins
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
                // Merestart container aplikasi login menggunakan image terbaru
                sh "docker compose down"
                sh "docker compose up -d"
                echo 'Aplikasi berhasil diperbarui di Production!'
            }
        }
    }

    post {
        always {
            echo 'Membersihkan sisa build lama...'
            // Menghapus image menggantung agar penyimpanan lokal tidak penuh
            sh "docker image prune -f"
        }
    }
}