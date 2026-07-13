pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.hub.docker.com'
        IMAGE_NAME = 'jibon/node-login-app' // Silakan sesuaikan nama image
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
                        docker.image('sonarsource/sonar-scanner-cli:latest').inside {
                            sh 'sonar-scanner'
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
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
    }
}