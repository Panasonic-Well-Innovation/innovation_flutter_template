/**
 * Comprehensive database connectivity tester for Nylas integration module
 * 
 * This script automatically:
 * 1. Tests database connectivity to PostgreSQL
 * 2. Checks IPv4/IPv6 connectivity and resolves common issues
 * 3. Verifies SSL certificate configuration
 * 
 * Run with: node test-connection.js
 */

const { PostgresAdapter } = require('./dist');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const os = require('os');
const { execSync } = require('child_process');

// Set DNS to prefer IPv4 for compatibility
dns.setDefaultResultOrder("ipv4first");

async function testDatabaseConnection() {
  console.log("🔄 NYLAS INTEGRATION MODULE CONNECTIVITY TEST");
  console.log("=============================================\n");

  // 1. SYSTEM CHECK
  console.log("📋 SYSTEM CHECK");
  console.log("-------------");
  
  // Check OS
  const osType = process.platform;
  console.log(`Operating System: ${osType}`);
  
  // Check Node version
  console.log(`Node.js Version: ${process.version}`);
  
  // Check for IPv6 support on system
  try {
    const networkInterfaces = Object.values(os.networkInterfaces());
    const hasIpv6 = networkInterfaces.some(interfaces => 
      interfaces.some(iface => iface.family === 'IPv6' && !iface.internal)
    );
    console.log(`IPv6 Interfaces Available: ${hasIpv6 ? "Yes" : "No"}\n`);
  } catch (error) {
    console.log("Could not determine IPv6 interface availability\n");
  }

  // 2. DATABASE CONFIGURATION
  console.log("🔍 DATABASE CONFIGURATION");
  console.log("------------------------");

  // Read the .env file from the demo app
  const envPath = path.resolve(__dirname, 'examples/nylas-demo/server/.env');
  let connectionString;
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const connectionStringMatch = envContent.match(/CONNECTION_STRING=(.+)/);
    
    if (connectionStringMatch) {
      connectionString = connectionStringMatch[1];
      console.log(`Connection string found: ${connectionString.substring(0, 20)}...`);
    } else {
      console.error("❌ CONNECTION_STRING not found in .env file");
      console.log("Please set this in your .env file. Example:");
      console.log("CONNECTION_STRING=postgresql://username:password@hostname:port/database");
      return;
    }
  } catch (error) {
    console.error(`❌ Could not read .env file: ${error.message}`);
    console.log("Please ensure the .env file exists at:", envPath);
    return;
  }
  
  // Parse the connection string to extract parts
  const match = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error("❌ Invalid connection string format");
    console.log("Expected format: postgresql://username:password@hostname:port/database");
    return;
  }
  
  const [_, user, password, host, port, database] = match;
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}\n`);
  
  // 3. DNS RESOLUTION TEST
  console.log("🌐 DNS RESOLUTION TEST");
  console.log("--------------------");
  
  // Test IPv4 resolution
  try {
    console.log(`Testing IPv4 resolution for ${host}...`);
    const ipv4Addresses = await new Promise((resolve, reject) => {
      dns.resolve4(host, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    
    if (ipv4Addresses && ipv4Addresses.length > 0) {
      console.log(`✅ IPv4 addresses found: ${ipv4Addresses.join(', ')}`);
    } else {
      console.log(`❌ No IPv4 addresses found for ${host}`);
    }
  } catch (error) {
    console.log(`❌ IPv4 resolution failed: ${error.message}`);
  }
  
  // Test IPv6 resolution
  try {
    console.log(`Testing IPv6 resolution for ${host}...`);
    const ipv6Addresses = await new Promise((resolve, reject) => {
      dns.resolve6(host, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    
    if (ipv6Addresses && ipv6Addresses.length > 0) {
      console.log(`✅ IPv6 addresses found: ${ipv6Addresses.join(', ')}`);
    } else {
      console.log(`❌ No IPv6 addresses found for ${host}`);
    }
  } catch (error) {
    console.log(`❌ IPv6 resolution failed: ${error.message}`);
  }
  
  // Ping test
  console.log(`Testing connectivity to ${host}...`);
  try {
    execSync(`ping -c 1 ${host}`);
    console.log(`✅ Host is reachable\n`);
  } catch (error) {
    console.log(`❌ Cannot reach host with ping\n`);
  }
  
  // 4. SSL CERTIFICATE CHECK
  console.log("🔒 SSL CERTIFICATE CHECK");
  console.log("----------------------");
  
  // Read certificate path from .env file
  let certPath = null;
  try {
    // Check if CERT_PATH is defined in the .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    const certPathMatch = envContent.match(/CERT_PATH=(.+)/);
    
    if (certPathMatch) {
      // Get the certificate path relative to the .env file location
      const relativeCertPath = certPathMatch[1].trim();
      const envDir = path.dirname(envPath);
      certPath = path.resolve(envDir, relativeCertPath);
      
      if (fs.existsSync(certPath)) {
        console.log(`✅ SSL certificate found at: ${certPath}`);
        console.log(`   (Using CERT_PATH from .env file: ${relativeCertPath})`);
      } else {
        console.log(`❌ Certificate not found at path specified in .env: ${certPath}`);
        certPath = null;
      }
    } else {
      console.log(`❌ CERT_PATH not defined in .env file`);
      console.log(`   Please add CERT_PATH=prod-ca-2021.crt (or your certificate path) to your .env file`);
    }
  } catch (error) {
    console.log(`❌ Error reading certificate path: ${error.message}`);
  }
  
  let sslConfig;
  if (certPath) {
    sslConfig = {
      ca: fs.readFileSync(certPath).toString(),
      rejectUnauthorized: true
    };
  } else {
    console.log("❌ SSL certificate not found");
    console.log("- Add CERT_PATH=your-cert-file.crt to your .env file");
    console.log("- Certificate path should be relative to the .env file location");
    console.log("- Will proceed with insecure connection (not recommended for production)");
    sslConfig = {
      rejectUnauthorized: false
    };
  }
  console.log("");

  // 5. DATABASE CONNECTION TEST
  console.log("🗄️ DATABASE CONNECTION TEST");
  console.log("-------------------------");

  // Create the PostgresAdapter with explicit object config
  const config = {
    connection: {
      host: host,
      port: parseInt(port),
      database: database,
      user: user,
      password: password,
      ssl: sslConfig
    },
    tables: {
      credentials: "test_credentials",
      events: "test_events",
      calendars: "test_calendars"
    },
    logger: {
      enabled: true,
      level: 'info',
      prettyPrint: true
    }
  };

  // Try with IPv4 preference first
  console.log("Testing connection with IPv4 preference...");
  try {
    const adapter = new PostgresAdapter(config);
    
    // Connect to the database
    console.log("Connecting to database...");
    await adapter.connect();
    console.log("✅ Connected to database successfully");
    
    // Test a simple query
    console.log("Testing query...");
    const result = await adapter.executeQuery("SELECT NOW() as time");
    console.log(`✅ Query successful: ${result[0].time}`);
    
    // Disconnect
    await adapter.disconnect();
    console.log("Connection closed successfully");
    
  } catch (error) {
    console.error(`❌ Connection test failed: ${error.message}`);
    
    // Try with direct IPv4 address if we have one
    try {
      console.log("\nTrying with direct IPv4 address...");
      const ipv4Addresses = await new Promise((resolve, reject) => {
        dns.resolve4(host, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      
      if (ipv4Addresses && ipv4Addresses.length > 0) {
        const ipv4Host = ipv4Addresses[0];
        console.log(`Using IPv4 address: ${ipv4Host}`);
        
        // Update config with direct IP
        config.connection.host = ipv4Host;
        
        const adapter2 = new PostgresAdapter(config);
        await adapter2.connect();
        console.log("✅ Connected successfully with direct IPv4 address");
        
        const result = await adapter2.executeQuery("SELECT NOW() as time");
        console.log(`✅ Query successful: ${result[0].time}`);
        
        await adapter2.disconnect();
        console.log("Connection closed successfully");
      } else {
        console.log("❌ No IPv4 addresses available to try direct connection");
      }
    } catch (fallbackError) {
      console.error(`❌ Direct IPv4 connection also failed: ${fallbackError.message}`);
    }
  }
  
  // 6. RECOMMENDATIONS
  console.log("\n✨ RECOMMENDATIONS");
  console.log("----------------");
  console.log("If you're experiencing connection issues:");
  console.log("1. Check your network's IPv6 configuration - some networks have limited IPv6 support");
  console.log("2. Ensure SSL certificates are properly installed for secure connections");
  console.log("3. Verify firewall settings allow PostgreSQL connections (port 5432)");
  console.log("4. When using the SDK, the testConnectionOnInit and preferIpv4 options are enabled by default");
  console.log("5. For Supabase, their databases are IPv6-only, so ensure proper IPv6 connectivity");
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log("\n✅ Connection test completed");
  })
  .catch(error => {
    console.error("\n❌ Error during connection test:", error);
    console.log("Please check your configuration and network settings");
  }); 