/**
 * @file scripts/test-sharepoint-connection.ts
 * @description Simple script to test SharePoint connection and configuration
 * Verifies authentication, list access, and permissions
 */

import { config } from 'dotenv';
import {
  getSharePointConfig,
  validateAuthConfig,
  getAccessToken,
  getTokenExpiration,
  getSharePointClient,
  JobsListService,
  ProjectsListService,
  TendersListService,
  ScopeReportsListService,
  DivisionRequestsListService,
  QAPacksListService,
  IncidentsListService,
  DocumentsService,
} from '../src/lib/sharepoint';

// Load environment variables
config();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Print colored status
 */
function printStatus(status: 'PASS' | 'FAIL' | 'SKIP'): string {
  const colors = {
    PASS: '\x1b[32m', // Green
    FAIL: '\x1b[31m', // Red
    SKIP: '\x1b[33m', // Yellow
  };
  const reset = '\x1b[0m';
  return `${colors[status]}${status}${reset}`;
}

/**
 * Run a test and capture result
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  console.log(`\nTesting: ${name}...`);

  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({
      name,
      status: 'PASS',
      message: 'Test passed successfully',
      duration,
    });
    console.log(`  ${printStatus('PASS')} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      name,
      status: 'FAIL',
      message,
      duration,
    });
    console.log(`  ${printStatus('FAIL')}: ${message}`);
  }
}

/**
 * Test 1: Check environment variables
 */
async function testEnvironmentVariables(): Promise<void> {
  const required = [
    'SHAREPOINT_SITE_URL',
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  console.log('  Environment variables configured:');
  console.log(`    - SHAREPOINT_SITE_URL: ${process.env.SHAREPOINT_SITE_URL}`);
  console.log(`    - AZURE_TENANT_ID: ${process.env.AZURE_TENANT_ID?.slice(0, 8)}...`);
  console.log(`    - AZURE_CLIENT_ID: ${process.env.AZURE_CLIENT_ID?.slice(0, 8)}...`);
  console.log(`    - AZURE_CLIENT_SECRET: ${process.env.AZURE_CLIENT_SECRET ? '***' : 'NOT SET'}`);
}

/**
 * Test 2: Validate SharePoint configuration
 */
async function testSharePointConfig(): Promise<void> {
  const config = getSharePointConfig();

  if (!config.siteUrl || !config.tenantId || !config.clientId || !config.clientSecret) {
    throw new Error('Invalid SharePoint configuration');
  }

  console.log('  Configuration loaded successfully');
  console.log(`    - Site URL: ${config.siteUrl}`);
  console.log(`    - Tenant ID: ${config.tenantId.slice(0, 8)}...`);
}

/**
 * Test 3: Test authentication
 */
async function testAuthentication(): Promise<void> {
  const { valid, error } = await validateAuthConfig();

  if (!valid) {
    throw new Error(`Authentication failed: ${error}`);
  }

  console.log('  Authentication successful');

  // Get token details
  const token = await getAccessToken();
  const expiration = getTokenExpiration();

  console.log(`    - Token acquired: ${token.slice(0, 20)}...`);
  if (expiration) {
    const expiresIn = Math.round((expiration - Date.now()) / 1000 / 60);
    console.log(`    - Token expires in: ${expiresIn} minutes`);
  }
}

/**
 * Test 4: Test SharePoint client connectivity
 */
async function testClientConnectivity(): Promise<void> {
  const client = getSharePointClient();

  // Try to get site information
  const siteInfo = await client.get('/_api/web');

  if (!siteInfo) {
    throw new Error('Failed to retrieve site information');
  }

  console.log('  SharePoint client connected');
  console.log(`    - Site Title: ${siteInfo.Title || 'N/A'}`);
  console.log(`    - Web URL: ${siteInfo.Url || 'N/A'}`);
}

/**
 * Test 5: Verify Jobs list exists
 */
async function testJobsList(): Promise<void> {
  const jobs = await JobsListService.getItems({ top: 1 });

  console.log('  Jobs list accessible');
  console.log(`    - Sample records available: ${jobs.length > 0 ? 'Yes' : 'No'}`);

  if (jobs.length > 0) {
    console.log(`    - Sample Job ID: ${jobs[0].Id}`);
  }
}

/**
 * Test 6: Verify Projects list exists
 */
async function testProjectsList(): Promise<void> {
  const projects = await ProjectsListService.getItems({ top: 1 });

  console.log('  Projects list accessible');
  console.log(`    - Sample records available: ${projects.length > 0 ? 'Yes' : 'No'}`);

  if (projects.length > 0) {
    console.log(`    - Sample Project ID: ${projects[0].Id}`);
  }
}

/**
 * Test 7: Verify all required lists exist
 */
async function testAllLists(): Promise<void> {
  const lists = [
    { name: 'Jobs', service: JobsListService },
    { name: 'Projects', service: ProjectsListService },
    { name: 'Tenders', service: TendersListService },
    { name: 'ScopeReports', service: ScopeReportsListService },
    { name: 'DivisionRequests', service: DivisionRequestsListService },
    { name: 'QAPacks', service: QAPacksListService },
    { name: 'Incidents', service: IncidentsListService },
  ];

  console.log('  Checking all required lists:');

  for (const list of lists) {
    try {
      await list.service.getItemCount();
      console.log(`    - ${list.name}: ✓ Accessible`);
    } catch (error) {
      console.log(`    - ${list.name}: ✗ Not accessible`);
      throw new Error(`List ${list.name} is not accessible`);
    }
  }
}

/**
 * Test 8: Test document library access
 */
async function testDocumentLibrary(): Promise<void> {
  // Try to list files in root
  const files = await DocumentsService.listFiles(undefined, { top: 5 });

  console.log('  Documents library accessible');
  console.log(`    - Files found: ${files.length}`);

  if (files.length > 0) {
    console.log(`    - Sample file: ${files[0].Name || files[0].FileLeafRef}`);
  }
}

/**
 * Test 9: Test write permissions (create and delete)
 */
async function testWritePermissions(): Promise<void> {
  const testItem = {
    Title: `TEST-${Date.now()}`,
    JobType: 'Test',
    Status: 'Test',
    Client: 'Test Client',
    Location: 'Test Location',
    Description: 'This is a test item that will be deleted immediately',
  };

  // Try to create
  const created = await JobsListService.createItem(testItem);
  console.log('  Write permission verified');
  console.log(`    - Test item created: ${created.Id}`);

  // Clean up - delete test item
  await JobsListService.deleteItem(created.Id);
  console.log(`    - Test item deleted: ${created.Id}`);
}

/**
 * Test 10: Test query and filter operations
 */
async function testQueryOperations(): Promise<void> {
  // Test filtering
  const filteredJobs = await JobsListService.getItems({
    top: 5,
    orderBy: 'Created',
    orderByDescending: true,
  });

  console.log('  Query operations working');
  console.log(`    - Filtered query returned: ${filteredJobs.length} records`);

  // Test count
  const count = await JobsListService.getItemCount();
  console.log(`    - Total Jobs count: ${count}`);
}

/**
 * Test 11: Test batch operations
 */
async function testBatchOperations(): Promise<void> {
  const testItems = [
    {
      Title: `BATCH-TEST-1-${Date.now()}`,
      JobType: 'Test',
      Status: 'Test',
      Client: 'Test Client',
      Location: 'Test Location',
    },
    {
      Title: `BATCH-TEST-2-${Date.now()}`,
      JobType: 'Test',
      Status: 'Test',
      Client: 'Test Client',
      Location: 'Test Location',
    },
  ];

  // Create batch
  const batchResult = await JobsListService.batchCreate(testItems);

  if (!batchResult.success || batchResult.errors.length > 0) {
    throw new Error('Batch create failed');
  }

  console.log('  Batch operations working');
  console.log(`    - Created ${batchResult.results.length} items in batch`);

  // Clean up
  for (const item of batchResult.results) {
    await JobsListService.deleteItem(item.Id);
  }
  console.log(`    - Cleaned up ${batchResult.results.length} test items`);
}

/**
 * Test 12: Test error handling
 */
async function testErrorHandling(): Promise<void> {
  try {
    // Try to get non-existent item
    await JobsListService.getItem(999999999);
    throw new Error('Expected error was not thrown');
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log('  Error handling working correctly');
      console.log(`    - 404 error properly caught and handled`);
    } else {
      throw error;
    }
  }
}

/**
 * Print summary
 */
function printSummary(): void {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${printStatus('PASS')} ${passed}`);
  console.log(`Failed: ${printStatus('FAIL')} ${failed}`);
  console.log(`Skipped: ${printStatus('SKIP')} ${skipped}`);

  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(`\nTotal Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }

  console.log('\n' + '='.repeat(80));
  console.log(failed === 0 ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗');
  console.log('='.repeat(80) + '\n');
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('SHAREPOINT CONNECTION TEST');
  console.log('='.repeat(80) + '\n');
  console.log('This script will test SharePoint connectivity and configuration.');
  console.log('Some tests may create temporary data that will be cleaned up.\n');

  await runTest('Environment Variables', testEnvironmentVariables);
  await runTest('SharePoint Configuration', testSharePointConfig);
  await runTest('Authentication', testAuthentication);
  await runTest('Client Connectivity', testClientConnectivity);
  await runTest('Jobs List Access', testJobsList);
  await runTest('Projects List Access', testProjectsList);
  await runTest('All Lists Verification', testAllLists);
  await runTest('Document Library Access', testDocumentLibrary);
  await runTest('Write Permissions', testWritePermissions);
  await runTest('Query Operations', testQueryOperations);
  await runTest('Batch Operations', testBatchOperations);
  await runTest('Error Handling', testErrorHandling);

  printSummary();

  // Exit with appropriate code
  const failed = results.filter(r => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('\n' + '='.repeat(80));
  console.error('FATAL ERROR');
  console.error('='.repeat(80));
  console.error('\n', error);
  console.error('\n' + '='.repeat(80) + '\n');
  process.exit(1);
});
