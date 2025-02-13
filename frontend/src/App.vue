<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<style>
:root {
  --background-color: #ffffff;
  --text-color: #2c3e50;
  --border-color: #ddd;
  --nav-hover-color: rgba(44, 62, 80, 0.1);
  --form-background: #f8f9fa;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1a1a1a;
    --text-color: #ffffff;
    --border-color: #444;
    --nav-hover-color: rgba(255, 255, 255, 0.1);
    --form-background: #2d2d2d;
  }
}

.app-container {
  background-color: var(--background-color);
  color: var(--text-color);
  min-height: 100vh;
}

header {
  line-height: 1.5;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

nav {
  width: 100%;
  font-size: 1rem;
  text-align: center;
}

nav a {
  display: inline-block;
  padding: 0.5rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 4px;
  margin: 0 0.5rem;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: var(--nav-hover-color);
}

nav a.router-link-active {
  font-weight: bold;
  background-color: var(--nav-hover-color);
}

@media (min-width: 1024px) {
  header {
    display: flex;
    justify-content: center;
  }

  nav {
    text-align: center;
    font-size: 1rem;
    padding: 1rem 0;
  }
}
</style>
