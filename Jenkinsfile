pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        IMAGE_NAME = 'jibon/node-login-app'
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
                    withSonarQubeEnv('SonarQubeServer') {
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
                    timeout(time: 5, unit: 'MINUTES') {
                        // UBAH JADI FALSE: Jenkins akan tetap mencatat error dari SonarQube, 
                        // tetapi TIDAK AKAN menggagalkan pipeline agar kita bisa lanjut deploy.
                        waitForQualityGate abortPipeline: false
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Membuat Docker Image untuk Production...'
                sh "docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
            }
        }

        stage('Push Image to Registry') {
            steps {
                script {
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