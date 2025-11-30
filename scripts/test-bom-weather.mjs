/**
 * Test BOM Weather Integration
 * Run with: node scripts/test-bom-weather.mjs
 */

// Geohash encoding function
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function encodeGeohash(latitude, longitude, precision = 7) {
  let latRange = { min: -90.0, max: 90.0 };
  let lngRange = { min: -180.0, max: 180.0 };
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isEven = true;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (lngRange.min + lngRange.max) / 2;
      if (longitude >= mid) {
        ch |= 1 << (4 - bit);
        lngRange.min = mid;
      } else {
        lngRange.max = mid;
      }
    } else {
      const mid = (latRange.min + latRange.max) / 2;
      if (latitude >= mid) {
        ch |= 1 << (4 - bit);
        latRange.min = mid;
      } else {
        latRange.max = mid;
      }
    }
    isEven = !isEven;
    bit++;
    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

// Test locations
const locations = [
  { name: 'Perth, WA', lat: -31.9505, lng: 115.8605 },
  { name: 'Sydney, NSW', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne, VIC', lat: -37.8136, lng: 144.9631 },
];

async function testBOMWeather(name, lat, lng) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name} (${lat}, ${lng})`);
  console.log('='.repeat(60));

  const geohash = encodeGeohash(lat, lng, 7);
  console.log(`Geohash: ${geohash}`);

  try {
    // Test observations
    const obsRes = await fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/observations`);
    const obsData = await obsRes.json();

    if (obsData.data) {
      console.log('\n📊 Current Observations:');
      console.log(`   Temperature: ${obsData.data.temp}°C`);
      console.log(`   Humidity: ${obsData.data.humidity}%`);
      console.log(`   Wind: ${obsData.data.wind?.speed_kilometre} km/h ${obsData.data.wind?.direction}`);
      console.log(`   Station: ${obsData.metadata?.name || 'Unknown'}`);
    }

    // Test daily forecast
    const dailyRes = await fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`);
    const dailyData = await dailyRes.json();

    if (dailyData.data?.length > 0) {
      const today = dailyData.data[0];
      console.log('\n📅 Today\'s Forecast:');
      console.log(`   Max: ${today.temp_max}°C, Min: ${today.temp_min || 'N/A'}°C`);
      console.log(`   Conditions: ${today.short_text}`);
      console.log(`   Rain: ${today.rain?.chance}% chance`);
      if (today.uv) {
        console.log(`   UV Index: ${today.uv.max_index} (${today.uv.category})`);
      }
      if (today.fire_danger) {
        console.log(`   🔥 Fire Danger: ${today.fire_danger}`);
      }
    }

    // Test hourly forecast
    const hourlyRes = await fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/hourly`);
    const hourlyData = await hourlyRes.json();

    if (hourlyData.data?.length > 0) {
      console.log('\n⏰ Next 6 Hours:');
      hourlyData.data.slice(0, 6).forEach(h => {
        const time = new Date(h.time).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ${time}: ${h.temp}°C, ${h.icon_descriptor}, Rain ${h.rain?.chance}%`);
      });
    }

    // Test warnings
    const warnRes = await fetch(`https://api.weather.bom.gov.au/v1/locations/${geohash}/warnings`);
    const warnData = await warnRes.json();

    console.log(`\n⚠️  Active Warnings: ${warnData.data?.length || 0}`);
    if (warnData.data?.length > 0) {
      warnData.data.forEach(w => {
        console.log(`   - ${w.short_title || w.title}`);
      });
    }

    console.log('\n✅ BOM API working for this location!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     BOM Weather Integration Test                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  for (const loc of locations) {
    await testBOMWeather(loc.name, loc.lat, loc.lng);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
