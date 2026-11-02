<script setup lang="ts">
import Header from './layouts/Header.vue';
import Footer from './layouts/Footer.vue';
</script>

<template>


  <main>
    <Header/>
    <section class="landing-hero">
      <span class="badge badge-purple">
        <svg aria-hidden="true" class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"></path>
        </svg>
        Built for product teams
      </span>

      <h1>Turn customer feedback into your product roadmap.</h1>

      <p>Pulse helps teams collect feedback, prioritize the requests that matter, and keep customers informed as ideas become reality.</p>

      <div class="hero-actions">
        <RouterLink to="/register">
          <button type="button" class="btn btn-primary">Get started <span>→</span></button>
        </RouterLink>
        <RouterLink to="/login">
          <button type="button" class="btn btn-secondary">Sign in</button>
        </RouterLink>
      </div>

      <div class="hero-note">
        <span>
          <svg aria-hidden="true" class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 4 4L19 6"></path>
          </svg>
        </span>
          No credit card required <i></i> Set up in minutes
      </div>

      <div class="product-preview">
        <div class="preview-browser">
          <span></span>
          <span></span>
          <span></span>
          <small>app.pulse.so/acme/dashboard</small>
        </div>

        <div class="preview-app">
          <aside>
            <div class="logo">
            <span class="logo-mark">
              <span></span>
              <span></span>
              <span></span>
            </span>
            </div>
            <i></i><i></i><i></i><i></i><i></i><span></span>
          </aside>

          <div class="preview-main">
            <div class="preview-heading">
              <div>
                <small>Good morning, Alex</small>
                <i></i>
              </div>
              <span></span>
            </div>

            <div class="preview-stats">
              <div><i></i><span></span><strong></strong></div>
              <div><i></i><span></span><strong></strong></div>
              <div><i></i><span></span><strong></strong></div>
              <div><i></i><span></span><strong></strong></div>
            </div>

            <div class="preview-panels">
              <div class="preview-chart">
                <strong>Feedback activity</strong>
                <small>Last 30 days</small>
                <svg viewBox="0 0 580 150" preserveAspectRatio="none">
                  <path d="M0 138H580M0 95H580M0 52H580M0 10H580" class="preview-grid-line"></path>
                  <path d="M0 125C34 115 55 125 83 95s48 4 75-22 45-8 72-31 45 22 72 6 43-23 73-4 41-34 73-26 43 31 73 10 39 3 59-8" class="preview-line"></path>
                </svg>
              </div>

              <div class="preview-requests">
                <strong>Top requests</strong>
                <div>
                  <span>1</span>
                  <p>Dark mode<i></i></p>
                  <small>186</small>
                </div>
                <div>
                  <span>2</span>
                  <p>API access tokens<i></i></p>
                  <small>144</small>
                </div>
                <div>
                  <span>3</span>
                  <p>Google Drive<i></i></p>
                  <small>102</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="landing-proof">
      <p>One clear place for customer insight and product decisions</p>
      <div>
        <span><i class="proof-mark proof-1"></i>Northstar</span>
        <span><i class="proof-mark proof-2"></i>Untitled</span>
        <span><i class="proof-mark proof-3"></i>Vertex</span>
        <span><i class="proof-mark proof-4"></i>Layers</span>
        <span><i class="proof-mark proof-5"></i>Waypoint</span>
      </div>
    </section>

    <section class="landing-section how-section" id="how-it-works">
      <div class="section-intro">
        <span class="badge badge-neutral">How it works</span>
        <h2>From customer signal to shipped product.</h2>
        <p>A simple workflow that keeps feedback connected to the work your team is already doing.</p>
      </div>

      <div class="steps">
        <article class="step-card">
          <div>
            <span>01</span>
            <i>
              <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1-5a9 9 0 1 1 18-5Z"></path>
              </svg>
            </i>
          </div>
          <h3>Collect feedback</h3>
          <p>Capture requests from customers, teammates, and your public portal in one inbox.</p>
        </article>

        <article class="step-card">
          <div>
            <span>02</span>
            <i>
              <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 17 6-6 4 4 8-8M15 7h6v6"></path>
              </svg>
            </i>
          </div>
          <h3>Prioritize</h3>
          <p>Use votes, tags, and customer context to find the ideas worth building next.</p>
        </article>

        <article class="step-card">
          <div>
            <span>03</span>
            <i>
              <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m5 12 4 4L19 6"></path>
              </svg>
            </i>
          </div>
          <h3>Build</h3>
          <p>Share progress on a clear roadmap and close the loop when work ships.</p>
        </article>
      </div>
    </section>

    <section class="landing-section feature-section" id="features">
      <div class="section-intro left">
        <span class="badge badge-neutral">Everything connected</span>
        <h2>One system for your feedback loop.</h2>
        <p>Pulse gives your team the context and tools to make confident product decisions.</p>
      </div>

      <div class="feature-grid">
        <article class="feature-card">
          <span class="stat-icon violet">
            <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1-5a9 9 0 1 1 18-5Z"></path>
            </svg>
          </span>
          <h3>Feedback</h3>
          <p>Bring every customer insight into one organized, searchable place.</p>
          <button>Learn more <span>→</span></button>
        </article>

        <article class="feature-card">
          <span class="stat-icon blue">
            <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 15-6-6-6 6"></path>
              <path d="M12 9v12"></path>
            </svg>
          </span>
          <h3>Voting</h3>
          <p>Let customers and teammates signal what matters most.</p>
          <button>Learn more <span>→</span></button>
        </article>

        <article class="feature-card">
          <span class="stat-icon amber">
            <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"></path>
              <path d="M9 3v15M15 6v15"></path>
            </svg>
          </span>
          <h3>Roadmap</h3>
          <p>Turn validated requests into a roadmap everyone can follow.</p>
          <button>Learn more <span>→</span></button>
        </article>

        <article class="feature-card">
          <span class="stat-icon green">
            <svg aria-hidden="true" class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          <h3>Team collaboration</h3>
          <p>Give product teams shared context for every decision.</p>
          <button>Learn more <span>→</span></button>
        </article>
      </div>
    </section>

    <section class="landing-cta">
      <span class="cta-mark">
        <div class="logo">
          <span class="logo-mark">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </span>
      <h2>Start building with Pulse.</h2>
      <p>Turn customer insight into a roadmap your team and customers believe in.</p>
      <RouterLink to="/register">
        <button type="button" class="btn btn-primary">Get started for free <span>→</span></button>
      </RouterLink>
    </section>

    <Footer/>
  </main>
</template>
