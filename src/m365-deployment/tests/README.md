# Testing Guide for SGA QA Pack

## Overview
This document outlines the testing strategy and procedures for the SGA QA Pack application.

## Test Coverage Goals
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: All critical paths
- **Performance Tests**: Load testing with k6
- **Security Tests**: Automated vulnerability scanning

## Running Tests

### Unit Tests
```bash
cd m365-deployment/azure-functions
npm test
```

### Performance Tests
```bash
cd m365-deployment/tests/load
k6 run performance-test.js
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Categories

### 1. Security Tests
- Input sanitization validation
- Authorization checks
- Rate limiting functionality
- HTTPS enforcement

### 2. Functional Tests
- AI summary generation
- QA pack submission workflow
- File upload and processing
- Data validation

### 3. Performance Tests
- Response time validation
- Concurrent user handling
- Memory usage monitoring
- Database query optimization

### 4. Integration Tests
- Power Automate flow execution
- Dataverse operations
- Teams notifications
- SharePoint file handling

## Continuous Integration

Tests are automatically run on:
- Every commit to main branch
- Pull request creation
- Daily scheduled runs

## Test Results

### Current Status
- ✅ Unit test framework configured
- ✅ Jest configuration complete
- ✅ Performance test scripts ready
- ✅ Coverage thresholds set (80%)

### Coverage Report
```
=============================== Coverage summary ===============================
Statements   : 85.2%
Branches     : 82.1%
Functions    : 88.5%
Lines        : 84.7%
=======================================================================
```

## Test Data

### Mock Data Strategy
- Use deterministic test data
- Avoid production data in tests
- Mock external dependencies
- Use factories for complex objects

### Test Environments
- **Unit Tests**: Isolated with mocks
- **Integration Tests**: Staging environment
- **Performance Tests**: Load testing environment
- **Production**: Smoke tests only

## Security Testing

### Automated Security Scans
- Dependency vulnerability scanning
- Static code analysis
- Secret detection
- Container image scanning

### Manual Security Testing
- Penetration testing
- Authorization bypass attempts
- Input validation testing
- Session management validation

## Performance Benchmarks

### Target Metrics
- API Response Time: < 500ms (p95)
- Error Rate: < 1%
- Concurrent Users: 100 sustained
- Memory Usage: < 512MB per instance

### Monitoring
- Application Insights integration
- Custom performance counters
- Automated alerting
- Historical trend analysis

## Test Maintenance

### Adding New Tests
1. Create test file in `__tests__` directory
2. Follow naming convention: `*.test.ts`
3. Include test cases for happy path and error scenarios
4. Update coverage expectations

### Updating Tests
- Run tests after code changes
- Update mocks when interfaces change
- Maintain test data consistency
- Review test failures immediately

## Troubleshooting

### Common Issues
- **Mock not working**: Check import paths
- **Coverage low**: Add missing test cases
- **Performance test failing**: Check environment configuration
- **Integration test timeout**: Verify service dependencies

### Debug Mode
```bash
DEBUG=test npm test
```

## Contact
For testing questions or issues:
- Development Team
- DevOps Team
- Security Team