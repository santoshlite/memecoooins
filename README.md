<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.cointribune.com/app/uploads/2024/05/CTB-Logo-3.gif">
    <source media="(prefers-color-scheme: light)" srcset="https://www.cointribune.com/app/uploads/2024/05/CTB-Logo-3.gif">
    <img alt="Memecoooins Logo" src="https://www.cointribune.com/app/uploads/2024/05/CTB-Logo-3.gif" width="300" height="300">
  </picture>

  <h1>Memecoooins</h1>
  <p>🚀 Dive into the world of meme coins with our crypto roulette platform!</p>

  <div>
    <img src="https://img.shields.io/badge/Made%20with-SvelteKit-FF3E00?style=for-the-badge&logo=svelte" alt="Made with SvelteKit">
    <img src="https://img.shields.io/badge/Powered%20by-Solana-14F195?style=for-the-badge&logo=solana" alt="Powered by Solana">
    <img src="https://img.shields.io/badge/Status-Alpha-red?style=for-the-badge" alt="Status">
  </div>

  <br />

  <p align="center">
    <a href="#overview">Overview</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#architecture">Architecture</a>
  </p>
</div>

<div id="overview">
  <h2>💫 Overview</h2>
  <p>Experience the thrill of crypto roulette! For just $50, get a mystery wallet packed with trending meme coins. Watch your portfolio evolve with hourly updates and cash out whenever you want.</p>
</div>

<div id="features">
  <h2>✨ Key Features</h2>
  <ul>
    <li>🎲 <strong>Mystery Wallets:</strong> $50 buys you a diverse crypto portfolio</li>
    <li>💰 <strong>Meme Coin Magic:</strong> Get random allocations of popular tokens</li>
    <li>📊 <strong>Live Updates:</strong> Track your portfolio value in real-time</li>
    <li>💸 <strong>Flexible Cashout:</strong> Convert to USDC at your convenience</li>
    <li>🔒 <strong>Bank-Grade Security:</strong> Powered by Solana blockchain</li>
  </ul>
</div>

<div id="tech-stack">
  <h2>🛠️ Technology Stack</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Technology</th>
    </tr>
    <tr>
      <td>Frontend & Backend</td>
      <td><a href="https://kit.svelte.dev">SvelteKit</a> with SSR</td>
    </tr>
    <tr>
      <td>Database</td>
      <td><a href="https://www.postgresql.org/">PostgreSQL</a> + <a href="https://www.prisma.io/">Prisma</a></td>
    </tr>
    <tr>
      <td>Blockchain</td>
      <td><a href="https://solana.com">Solana</a>, <a href="https://raydium.io">Raydium DEX</a></td>
    </tr>
    <tr>
      <td>Price Data</td>
      <td><a href="https://www.coingecko.com">CoinGecko API</a></td>
    </tr>
    <tr>
      <td>Payments</td>
      <td><a href="https://stripe.com">Stripe</a></td>
    </tr>
    <tr>
      <td>Auth</td>
      <td><a href="https://clerk.com">Clerk</a></td>
    </tr>
  </table>
</div>

<div id="getting-started">
  <h2>🚀 Getting Started</h2>
  
  <h3>Prerequisites</h3>
  <ul>
    <li>Node.js v16+</li>
    <li>Docker</li>
    <li>pnpm</li>
  </ul>

  <h3>Quick Start</h3>

```bash
# Get the code
git clone https://github.com/santoshlite/memecoooins.git
cd memecoooins

# Setup environment
pnpm install
cp .env.example .env

# Launch development server
pnpm run dev
```
</div>

<div id="architecture">
  <h2>🏗️ System Architecture</h2>
  <div align="center">
    <img src="https://i.ibb.co/dpJT7Tq/Blockrok-Fig-Jam-1.png" alt="System Architecture" width="100%">
  </div>

  <h3>How It Works</h3>
  <ol>
    <li>👤 Users authenticate through Clerk's secure system</li>
    <li>💳 Make a $50 payment via Stripe's payment gateway</li>
    <li>🏦 System generates a Solana wallet and funds it with $45 USDC</li>
    <li>🎲 Smart contracts allocate funds to random meme coins via Raydium</li>
    <li>📈 Portfolio values update hourly using CoinGecko data</li>
    <li>💰 Users can exit positions anytime (10% platform fee applies)</li>
  </ol>
</div>

<div align="center">
  <hr />
  <p>
    Made with ❤️ by the Memecoooins Team
  </p>
</div>
