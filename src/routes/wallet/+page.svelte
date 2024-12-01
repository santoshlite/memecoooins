<script lang="ts">
  // Import necessary libraries
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import html2canvas from 'html2canvas';

  // Exported variables and initial data
  export let data;

  // Countdown components state
  let nextUpdateTimeLeft = 0;
  let autoRedeemTimeLeft = 0;
  let interval: NodeJS.Timeout;

  // Canvas and Chart variables
  let canvas: HTMLCanvasElement;
  let chart: Chart;

  // Reactive declarations using server data
  $: portfolioData = data.portfolioData;
  $: networthHistory = portfolioData?.netWorthHistory || [];
  $: netWorthChange = getNetWorthChange(networthHistory);
  $: statusMessage = getStatusMessage(netWorthChange);
  $: isPositive = netWorthChange > 0;
  $: currentNetWorth = networthHistory.length
    ? networthHistory[networthHistory.length - 1].netWorth
    : null;

  // Lifecycle hooks
  onMount(() => {
    updateCountdowns();
    interval = setInterval(updateCountdowns, 1000);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: networthHistory.length }, (_, i) => `Hour ${i + 1}`),
          datasets: [
            {
              label: 'Net Worth',
              data: networthHistory.map((h) => h.netWorth),
              borderColor: '#6c5ce7',
              backgroundColor: 'rgba(108, 92, 231, 0.1)',
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#a55eea',
              pointBorderColor: '#fff',
              pointHoverRadius: 8,
              pointHoverBackgroundColor: '#ff6b6b',
            },
          ],
        },
        options: {
          responsive: true,
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart',
          },
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ticks: {
                color: '#fff',
                font: {
                  family: 'VT323',
                },
              },
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
              },
              ticks: {
                color: '#fff',
                font: {
                  family: 'VT323',
                },
              },
            },
          },
        },
      });
    }
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (chart) chart.destroy();
  });

  // Functions
  function updateCountdowns() {
    nextUpdateTimeLeft = calculateTimeLeft(portfolioData.nextCheckTime);
    autoRedeemTimeLeft = calculateTimeLeft(portfolioData.redeemTime);
  }

  function calculateTimeLeft(targetTime: number) {
    const now = new Date().getTime();
    const difference = targetTime - now;
    return Math.max(0, Math.floor(difference / 1000));
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  function getNetWorthChange(
    history: Array<{ netWorth: number; coinsWorth: object }>
  ) {
    if (history.length < 2) return 0;
    return history[history.length - 1].netWorth - history[history.length - 2].netWorth;
  }

  function getStatusMessage(change: number) {
    if (change > 50) {
      return 'Absolutely crushing it! 🚀';
    } else if (change > 25) {
      return 'Looking good! 📈';
    } else if (change > 0) {
      return 'Slow and steady wins the race! 🐢';
    } else {
      return 'HODL strong! 💎';
    }
  }

  async function sharePortfolio(portfolioId: string) {
    try {
      // Capture the portfolio section
      const element = document.querySelector('.max-w-4xl');
      if (!element) throw new Error('Portfolio element not found');

      const canvas = await html2canvas(element as HTMLElement, {
        backgroundColor: '#000', // Match your background
        scale: 2, // Higher quality
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Download the image
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'portfolio.png';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error sharing portfolio:', error);
      alert('Failed to download portfolio. Please try again.');
    }
  }

  function handleRedeem() {
    alert('WAGMI 🚀🌕');
  }
</script>

<svelte:head>
  <title>Portfolio Dashboard 🚀</title>
  <meta name="description" content="Your crypto portfolio tracker" />
</svelte:head>

<div class="meme-bg min-h-screen text-white p-4">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <h1 class="glitch-text text-center mb-8 text-2xl md:text-4xl">
      ✨ Portfolio Dashboard ✨
    </h1>

    <!-- Portfolio Details -->
    <div class="cyber-card p-6 rounded-xl mb-8">
      <div>
        <div class="flex justify-between items-center mb-8">
          <h2 class="font-vt323 text-3xl">💰 BAG STATUS</h2>
          {#if currentNetWorth !== null}
            <p class="font-press-start-2p text-2xl text-green-400">
              ${currentNetWorth.toLocaleString()}
            </p>
          {:else}
            <div class="text-center">
              <p class="font-press-start-2p text-xl text-purple-400">
                Waiting for first update...
              </p>
            </div>
          {/if}
        </div>

        <div class="space-y-4">
          {#each portfolioData.coins as coin, index}
            <div class="cyber-card p-4 rounded-lg hover:scale-105 transition-transform">
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-vt323 text-xl text-purple-400">
                    Mystery Coin #{index + 1} 🤫
                  </p>
                  <p class="font-press-start-2p text-sm text-gray-400">
                    {coin.amount.toLocaleString()} coins
                  </p>
                </div>
                <p class="font-press-start-2p text-lg text-green-400">
                  {#if portfolioData.netWorthHistory.length > 0}
                    ${(portfolioData.netWorthHistory[portfolioData.netWorthHistory.length - 1]?.coinsWorth?.[coin.id] ?? 0).toLocaleString()}
                  {:else}
                    N/A
                  {/if}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Countdown Timers -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Next Update Countdown -->
      <div class="cyber-card p-6 rounded-xl text-center">
        <h3 class="font-vt323 text-xl mb-2">⏰ NEXT UPDATE IN</h3>
        <div class="relative">
          <div class="cyber-card p-4 rounded-xl text-center overflow-hidden">
            <div
              class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse-slow"
            ></div>
            <p class="font-vt323 text-4xl tracking-wider glitch-text">
              {formatTime(nextUpdateTimeLeft)}
            </p>
          </div>
        </div>
      </div>

      <!-- Auto Redeem Countdown -->
      <div class="cyber-card p-6 rounded-xl text-center">
        <h3 class="font-vt323 text-xl mb-2">⚡ AUTO-REDEEM IN</h3>
        <div class="relative">
          <div class="cyber-card p-4 rounded-xl text-center overflow-hidden">
            <div
              class="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse-slow"
            ></div>
            <p class="font-vt323 text-4xl tracking-wider glitch-text">
              {formatTime(autoRedeemTimeLeft)}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Networth Graph -->
    {#if networthHistory.length > 0}
      <div class="cyber-card p-4 rounded-xl mb-6">
        <canvas bind:this={canvas}></canvas>
      </div>
    {:else}
      <div class="cyber-card p-8 rounded-xl mb-6 text-center">
        <p class="font-vt323 text-2xl mb-4">📊 Waiting for first update...</p>
      </div>
    {/if}

    <!-- Status Message -->
    {#if currentNetWorth !== null}
      <div class="cyber-card p-4 rounded-xl mb-6 text-center relative overflow-hidden">
        <div
          class="absolute inset-0 opacity-10 animate-pulse-slow"
          style="background: {isPositive ? 'var(--gradient-1)' : 'var(--gradient-2)'}"
        ></div>
        <p class="font-press-start-2p text-sm mb-2">STATUS UPDATE:</p>
        <p class="font-vt323 text-2xl animate-bounce-slow">{statusMessage}</p>
        <p
          class="font-press-start-2p text-sm mt-4"
          class:text-green-400={isPositive}
          class:text-red-400={!isPositive}
        >
          {isPositive ? '↗️' : '↘️'} ${Math.abs(netWorthChange).toLocaleString()}
        </p>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        on:click={() => sharePortfolio(portfolioData.id)}
        class="cyber-card w-full py-4 px-6 rounded-xl font-press-start-2p text-sm hover:text-purple-400 transition-all"
      >
        🔗 SHARE THE SAUCE
      </button>
      <button
        on:click={handleRedeem}
        class="cyber-card w-full py-4 px-6 rounded-xl font-press-start-2p text-sm hover:text-green-400 transition-all"
      >
        💎 DIAMOND HANDS REDEEM
      </button>
    </div>
  </div>
</div>