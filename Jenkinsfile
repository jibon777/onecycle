pipeline {
    agent any

    environment {
        // Menggunakan docker.io agar sesuai dengan default registry saat push
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_NAME = 'jibon/node-login-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Cloning Code') {
            steps {
                echo 'Mengambil kode terbaru dari repository...'
                // Jenkins otomatis mengambil kode berdasarkan konfigurasi SCM di Job
            }
        }

        stage('SonarQube Code Analysis') {
            steps {
                script {
                    withSonarQubeEnv('SonarQubeServer') {
                        // Memastikan scanner masuk ke ci-network agar bisa terhubung dengan server SonarQube
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
                    // Menunggu Webhook dari SonarQube memberikan status Lulus/Gagal
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Membuat Docker Image untuk Production...'
                // Build dan Tag image dengan menyertakan domain docker.io
                sh "docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
            }
        }

        stage('Push Image to Registry') {
            steps {
                script {
                    // Login dan Push menggunakan variabel yang sudah diseragamkan
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'PASSWORD', usernameVariable: 'USERNAME')]) {
                        sh "echo \$PASSWORD | docker login -u \$USERNAME --password-stdin ${DOCKER_REGISTRY}"
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }

stage('Deploy to Production') {
            steps {
                echo 'Melakukan deployment ke server Production...'
                // Memastikan container lama bersih, lalu menarik image terbaru & membangun container DB kustom
                sh "IMAGE_NAME=${DOCKER_REGISTRY}/${IMAGE_NAME} docker compose down"
                sh "IMAGE_NAME=${DOCKER_REGISTRY}/${IMAGE_NAME} docker compose up -d --build"
                echo 'Aplikasi berhasil diperbarui di Production!'
            }
        }
    }

    post {
        always {
            echo 'Membersihkan sisa build lama...'
            sh "docker image prune -f"
        }
    }
}