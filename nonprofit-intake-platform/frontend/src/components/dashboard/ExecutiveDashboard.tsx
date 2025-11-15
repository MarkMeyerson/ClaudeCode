/**
 * Executive Dashboard
 * Real-time KPI monitoring with customizable widgets and drill-down capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Icon,
  Badge,
  Button,
  useColorModeValue,
  Progress,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  FaDollarSign,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFlag,
  FaCalendar,
  FaFileAlt,
} from 'react-icons/fa';

interface DashboardData {
  financialHealth: {
    overallScore: number;
    trend: 'up' | 'down' | 'stable';
    monthsOfReserves: number;
    burnRate: number;
  };
  compliance: {
    compliantCount: number;
    totalRequirements: number;
    overdueCount: number;
    upcomingDeadlines: number;
  };
  assessment: {
    completionPercentage: number;
    lastAssessmentDate: string;
    overallScore: number;
  };
  grants: {
    activeApplications: number;
    totalOpportunities: number;
    averageMatchScore: number;
  };
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // In production, fetch from API
    setTimeout(() => {
      setData({
        financialHealth: {
          overallScore: 78,
          trend: 'up',
          monthsOfReserves: 5.2,
          burnRate: 12500,
        },
        compliance: {
          compliantCount: 15,
          totalRequirements: 18,
          overdueCount: 1,
          upcomingDeadlines: 3,
        },
        assessment: {
          completionPercentage: 85,
          lastAssessmentDate: '2025-01-10',
          overallScore: 72,
        },
        grants: {
          activeApplications: 5,
          totalOpportunities: 23,
          averageMatchScore: 84,
        },
      });
      setLoading(false);
    }, 1000);
  };

  if (loading || !data) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading dashboard...</Text>
      </Container>
    );
  }

  const complianceRate = (data.compliance.compliantCount / data.compliance.totalRequirements) * 100;

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">Executive Dashboard</Heading>
            <HStack>
              <Button size="sm" variant="outline">
                Customize
              </Button>
              <Button size="sm" colorScheme="purple">
                Export Report
              </Button>
            </HStack>
          </Flex>

          {/* Key Metrics */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <MetricCard
              label="Financial Health"
              value={`${data.financialHealth.overallScore}/100`}
              trend={data.financialHealth.trend}
              icon={FaDollarSign}
              colorScheme="green"
              helpText="Overall financial health score"
            />
            <MetricCard
              label="Compliance Rate"
              value={`${Math.round(complianceRate)}%`}
              trend={complianceRate > 80 ? 'up' : 'down'}
              icon={FaCheckCircle}
              colorScheme="blue"
              helpText={`${data.compliance.compliantCount} of ${data.compliance.totalRequirements} compliant`}
            />
            <MetricCard
              label="Assessment Progress"
              value={`${data.assessment.completionPercentage}%`}
              trend="up"
              icon={FaFileAlt}
              colorScheme="purple"
              helpText="Current assessment completion"
            />
            <MetricCard
              label="Grant Opportunities"
              value={data.grants.totalOpportunities.toString()}
              trend="up"
              icon={FaFlag}
              colorScheme="orange"
              helpText={`${data.grants.activeApplications} active applications`}
            />
          </SimpleGrid>

          {/* Detailed Widgets */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Financial Health Detail */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Financial Health Monitor</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between">
                    <Text>Operating Reserves</Text>
                    <Text fontWeight="bold">{data.financialHealth.monthsOfReserves.toFixed(1)} months</Text>
                  </Flex>
                  <Progress
                    value={(data.financialHealth.monthsOfReserves / 12) * 100}
                    colorScheme={data.financialHealth.monthsOfReserves >= 6 ? 'green' : 'yellow'}
                    size="sm"
                    borderRadius="md"
                  />

                  <Flex justify="space-between">
                    <Text>Monthly Burn Rate</Text>
                    <Text fontWeight="bold">${(data.financialHealth.burnRate).toLocaleString()}</Text>
                  </Flex>

                  <Button size="sm" variant="outline" mt={2}>
                    View Full Report
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Compliance Status */}
            <Card bg={cardBg}>
              <CardHeader>
                <Heading size="md">Compliance Status</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaCheckCircle} color="green.500" />
                      <Text>Compliant</Text>
                    </HStack>
                    <Badge colorScheme="green">{data.compliance.compliantCount}</Badge>
                  </HStack>

                  {data.compliance.overdueCount > 0 && (
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FaExclamationTriangle} color="red.500" />
                        <Text>Overdue</Text>
                      </HStack>
                      <Badge colorScheme="red">{data.compliance.overdueCount}</Badge>
                    </HStack>
                  )}

                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaCalendar} color="orange.500" />
                      <Text>Upcoming (30 days)</Text>
                    </HStack>
                    <Badge colorScheme="orange">{data.compliance.upcomingDeadlines}</Badge>
                  </HStack>

                  <Button size="sm" variant="outline" mt={2}>
                    View Compliance Calendar
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Grant Opportunities */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Top Grant Opportunities</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <GrantOpportunityRow
                  title="Community Services Block Grant"
                  amount="$250,000"
                  matchScore={92}
                  deadline="2025-06-30"
                />
                <GrantOpportunityRow
                  title="Education Innovation Fund"
                  amount="$150,000"
                  matchScore={88}
                  deadline="2025-05-15"
                />
                <GrantOpportunityRow
                  title="Environmental Conservation Grant"
                  amount="$100,000"
                  matchScore={85}
                  deadline="2025-07-01"
                />

                <Button size="sm" variant="outline" mt={2}>
                  Discover More Grants
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

// Helper Components
interface MetricCardProps {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  colorScheme: string;
  helpText?: string;
}

function MetricCard({ label, value, trend, icon, colorScheme, helpText }: MetricCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Card bg={cardBg}>
      <CardBody>
        <Stat>
          <Flex justify="space-between" align="center">
            <Box>
              <StatLabel>{label}</StatLabel>
              <StatNumber fontSize="2xl">{value}</StatNumber>
              {helpText && (
                <StatHelpText mb={0}>
                  {trend !== 'stable' && <StatArrow type={trend === 'up' ? 'increase' : 'decrease'} />}
                  {helpText}
                </StatHelpText>
              )}
            </Box>
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="lg"
              bg={`${colorScheme}.100`}
              color={`${colorScheme}.600`}
            >
              <Icon as={icon} boxSize={6} />
            </Flex>
          </Flex>
        </Stat>
      </CardBody>
    </Card>
  );
}

interface GrantOpportunityRowProps {
  title: string;
  amount: string;
  matchScore: number;
  deadline: string;
}

function GrantOpportunityRow({ title, amount, matchScore, deadline }: GrantOpportunityRowProps) {
  return (
    <Flex justify="space-between" align="center" p={3} borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.700' }}>
      <VStack align="start" spacing={1}>
        <Text fontWeight="medium">{title}</Text>
        <HStack fontSize="sm" color="gray.600">
          <Text>{amount}</Text>
          <Text>•</Text>
          <Text>Due {deadline}</Text>
        </HStack>
      </VStack>
      <Badge colorScheme={matchScore >= 85 ? 'green' : 'blue'} fontSize="sm">
        {matchScore}% match
      </Badge>
    </Flex>
  );
}
