<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <h1 class="display-4 fw-bold mb-4">Welcome to Your Brand</h1>
            <p class="lead mb-4">
              Transform your business with our innovative solutions. We help you achieve your goals with cutting-edge technology.
            </p>
            <div class="d-flex gap-3">
              <a href="#" class="btn btn-primary btn-lg">Get Started</a>
              <a href="#" class="btn btn-outline-primary btn-lg">Learn More</a>
            </div>
          </div>
          <div class="col-lg-6 mt-5 mt-lg-0">
            <img src="https://placehold.co/600x400" alt="Hero Image" class="img-fluid rounded-3 shadow">
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features py-5" id="features">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="fw-bold">Our Features</h2>
          <p class="text-muted">Discover what makes us different</p>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center p-4">
                <div class="feature-icon mb-3">
                  <i class="bi bi-lightning-charge text-primary display-4"></i>
                </div>
                <h4>Fast & Efficient</h4>
                <p class="text-muted mb-0">Lightning fast performance that keeps your business running smoothly.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center p-4">
                <div class="feature-icon mb-3">
                  <i class="bi bi-shield-check text-primary display-4"></i>
                </div>
                <h4>Secure & Reliable</h4>
                <p class="text-muted mb-0">Enterprise-grade security to protect your valuable data.</p>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body text-center p-4">
                <div class="feature-icon mb-3">
                  <i class="bi bi-graph-up text-primary display-4"></i>
                </div>
                <h4>Analytics & Insights</h4>
                <p class="text-muted mb-0">Powerful analytics to help you make data-driven decisions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta bg-primary text-white py-5">
      <div class="container text-center">
        <h2 class="fw-bold mb-4">Ready to Get Started?</h2>
        <p class="lead mb-4">Join thousands of satisfied customers who trust our platform.</p>
        <router-link to="/login" class="btn btn-light btn-lg">Sign Up Now</router-link>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HomeBootstrap'
})
</script>

<style scoped>
.hero {
  padding: 6rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.features {
  background-color: #fff;
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cta {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}
</style>
