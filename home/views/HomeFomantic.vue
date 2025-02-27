<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="ui container">
        <div class="ui stackable two column grid middle aligned">
          <div class="column">
            <h1 class="ui huge header">Welcome to Your Brand</h1>
            <p class="ui large text">
              Transform your business with our innovative solutions. We help you achieve your goals with cutting-edge technology.
            </p>
            <div class="ui buttons">
              <a href="#" class="ui primary huge button">Get Started</a>
              <a href="#" class="ui huge basic primary button">Learn More</a>
            </div>
          </div>
          <div class="column">
            <img src="https://placehold.co/600x400" alt="Hero Image" class="ui fluid rounded image">
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="ui container">
        <div class="ui center aligned basic segment">
          <h2 class="ui header">Our Features</h2>
          <p class="ui grey text">Discover what makes us different</p>
        </div>
        <div class="ui three column stackable grid">
          <div class="column">
            <div class="ui raised segment text-center">
              <div class="feature-icon">
                <i class="bolt huge primary icon"></i>
              </div>
              <h3 class="ui header">Fast & Efficient</h3>
              <p class="ui grey text">Lightning fast performance that keeps your business running smoothly.</p>
            </div>
          </div>
          <div class="column">
            <div class="ui raised segment text-center">
              <div class="feature-icon">
                <i class="shield alternate huge primary icon"></i>
              </div>
              <h3 class="ui header">Secure & Reliable</h3>
              <p class="ui grey text">Enterprise-grade security to protect your valuable data.</p>
            </div>
          </div>
          <div class="column">
            <div class="ui raised segment text-center">
              <div class="feature-icon">
                <i class="chart line huge primary icon"></i>
              </div>
              <h3 class="ui header">Analytics & Insights</h3>
              <p class="ui grey text">Powerful analytics to help you make data-driven decisions.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="ui container center aligned">
        <h2 class="ui huge inverted header">Ready to Get Started?</h2>
        <p class="ui large inverted text">Join thousands of satisfied customers who trust our platform.</p>
        <router-link to="/login" class="ui huge white button">Sign Up Now</router-link>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HomeFomantic'
})
</script>

<style scoped>
.hero {
  padding: 6rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.features {
  padding: 5rem 0;
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
  padding: 5rem 0;
  background: linear-gradient(135deg, #2185d0 0%, #1678c2 100%);
}

.text-center {
  text-align: center;
}

/* Fomantic UI specific adjustments */
.ui.buttons {
  gap: 1rem;
}

.ui.raised.segment {
  height: 100%;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
