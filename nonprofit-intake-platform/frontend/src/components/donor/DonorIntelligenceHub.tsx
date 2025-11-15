/**
 * Donor Intelligence Hub
 * 360-degree donor view with engagement scoring, giving capacity analysis,
 * predictive insights, and action management
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  SimpleGrid,
  Grid,
  GridItem,
  Avatar,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Flex,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import {
  FaUser,
  FaDollarSign,
  FaChartLine,
  FaHeart,
  FaCalendar,
  FaBullseye,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTasks,
  FaLightbulb,
  FaTrophy,
} from 'react-icons/fa';

interface DonorIntelligence {
  donor: {
    donorId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    donorType: string;
    donorSegment: string;
    tags: string[];
    createdAt: Date;
  };
  donationHistory: {
    totalLifetimeValue: number;
    firstGiftDate: Date;
    lastGiftDate: Date;
    largestGift: number;
    averageGiftSize: number;
    donationCount: number;
    yearlyGiving: { [year: number]: number };
    givingFrequency: string;
    givingTrend: 'increasing' | 'stable' | 'decreasing';
  };
  engagement: {
    engagementScore: number;
    engagementLevel: string;
    retentionRisk: 'low' | 'medium' | 'high';
    nextBestAction: string;
  };
  givingCapacity: {
    estimatedCapacity: number;
    capacityRating: string;
    currentGiving: number;
    potentialGiving: number;
    gapAnalysis: number;
    askAmount: {
      minimum: number;
      target: number;
      stretch: number;
    };
  };
  predictiveInsights: {
    retentionProbability: number;
    upgradeProbability: number;
    churnRisk: number;
    lifetimeValueProjection: number;
    nextGiftPrediction: {
      amount: number;
      timeframe: string;
      confidence: number;
    };
    recommendedActions: string[];
  };
  actionItems: Array<{
    actionId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    dueDate: Date;
    status: string;
  }>;
}

export default function DonorIntelligenceHub() {
  const [donorData, setDonorData] = useState<DonorIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    loadDonorData();
  }, []);

  const loadDonorData = async () => {
    // In production, fetch from API
    setLoading(true);
    setTimeout(() => {
      const mockData: DonorIntelligence = {
        donor: {
          donorId: 'donor_001',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '(555) 123-4567',
          donorType: 'individual',
          donorSegment: 'major',
          tags: ['board_member', 'event_sponsor', 'monthly_donor'],
          createdAt: new Date('2020-01-15'),
        },
        donationHistory: {
          totalLifetimeValue: 45000,
          firstGiftDate: new Date('2020-03-15'),
          lastGiftDate: new Date('2024-12-15'),
          largestGift: 15000,
          averageGiftSize: 7500,
          donationCount: 6,
          yearlyGiving: { 2024: 15000, 2023: 12000, 2022: 10000, 2021: 5000, 2020: 3000 },
          givingFrequency: 'annual',
          givingTrend: 'increasing',
        },
        engagement: {
          engagementScore: 85,
          engagementLevel: 'highly_engaged',
          retentionRisk: 'low',
          nextBestAction: 'Schedule upgrade conversation',
        },
        givingCapacity: {
          estimatedCapacity: 112500,
          capacityRating: 'B+',
          currentGiving: 9000,
          potentialGiving: 22500,
          gapAnalysis: 13500,
          askAmount: {
            minimum: 15000,
            target: 22500,
            stretch: 30000,
          },
        },
        predictiveInsights: {
          retentionProbability: 92,
          upgradeProbability: 78,
          churnRisk: 8,
          lifetimeValueProjection: 135000,
          nextGiftPrediction: {
            amount: 10800,
            timeframe: '180 days',
            confidence: 85,
          },
          recommendedActions: [
            'Consider for major gift solicitation',
            'Schedule face-to-face meeting to discuss increased support',
          ],
        },
        actionItems: [
          {
            actionId: 'a1',
            priority: 'high',
            type: 'solicitation',
            description: 'Schedule upgrade conversation - high upgrade probability',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'pending',
          },
          {
            actionId: 'a2',
            priority: 'medium',
            type: 'stewardship',
            description: 'Send impact report highlighting scholarship fund results',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
          },
        ],
      };

      setDonorData(mockData);
      setLoading(false);
    }, 1000);
  };

  if (loading || !donorData) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading donor intelligence...</Text>
      </Container>
    );
  }

  const { donor, donationHistory, engagement, givingCapacity, predictiveInsights, actionItems } = donorData;

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'highly_engaged': return 'green';
      case 'engaged': return 'blue';
      case 'moderately_engaged': return 'yellow';
      case 'minimally_engaged': return 'orange';
      case 'inactive': return 'red';
      default: return 'gray';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return 'increase';
    if (trend === 'decreasing') return 'decrease';
    return undefined;
  };

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header - Donor Profile */}
          <Card bg={cardBg}>
            <CardBody>
              <Flex justify="space-between" align="start">
                <HStack spacing={4} align="start">
                  <Avatar
                    size="xl"
                    name={`${donor.firstName} ${donor.lastName}`}
                    bg="purple.500"
                  />
                  <VStack align="start" spacing={2}>
                    <Heading size="lg">
                      {donor.firstName} {donor.lastName}
                    </Heading>
                    <HStack spacing={4} fontSize="sm" color="gray.600">
                      <HStack>
                        <Icon as={FaEnvelope} />
                        <Text>{donor.email}</Text>
                      </HStack>
                      {donor.phone && (
                        <HStack>
                          <Icon as={FaPhone} />
                          <Text>{donor.phone}</Text>
                        </HStack>
                      )}
                    </HStack>
                    <HStack spacing={2}>
                      <Badge colorScheme="purple">{donor.donorSegment}</Badge>
                      <Badge>{donor.donorType}</Badge>
                      {donor.tags.map(tag => (
                        <Tag key={tag} size="sm" colorScheme="blue">
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>
                  </VStack>
                </HStack>

                <VStack align="end" spacing={2}>
                  <Button colorScheme="purple" size="sm">
                    Log Activity
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                  <Text fontSize="xs" color="gray.600">
                    Donor since {new Date(donor.createdAt).toLocaleDateString()}
                  </Text>
                </VStack>
              </Flex>
            </CardBody>
          </Card>

          {/* Key Metrics Dashboard */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Lifetime Value</StatLabel>
                  <StatNumber>${donationHistory.totalLifetimeValue.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <StatArrow type={getTrendIcon(donationHistory.givingTrend)} />
                    {donationHistory.givingTrend}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Engagement Score</StatLabel>
                  <StatNumber>{engagement.engagementScore}</StatNumber>
                  <StatHelpText>
                    <Badge colorScheme={getEngagementColor(engagement.engagementLevel)}>
                      {engagement.engagementLevel.replace('_', ' ')}
                    </Badge>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Capacity Rating</StatLabel>
                  <StatNumber>{givingCapacity.capacityRating}</StatNumber>
                  <StatHelpText>
                    ${givingCapacity.estimatedCapacity.toLocaleString()} capacity
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Retention Probability</StatLabel>
                  <StatNumber>{predictiveInsights.retentionProbability}%</StatNumber>
                  <StatHelpText>
                    <Badge colorScheme={getRiskColor(engagement.retentionRisk)}>
                      {engagement.retentionRisk} risk
                    </Badge>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Critical Actions Alert */}
          {actionItems.filter(a => a.priority === 'critical' || a.priority === 'high').length > 0 && (
            <Alert status="info">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  {actionItems.filter(a => a.priority === 'critical' || a.priority === 'high').length}{' '}
                  high-priority action{actionItems.length > 1 ? 's' : ''} pending
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Main Content Tabs */}
          <Tabs>
            <TabList>
              <Tab>
                <HStack>
                  <Icon as={FaChartLine} />
                  <Text>Giving Analysis</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FaHeart} />
                  <Text>Engagement</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FaDollarSign} />
                  <Text>Capacity</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FaBullseye} />
                  <Text>Predictive Insights</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FaTasks} />
                  <Text>Action Items ({actionItems.length})</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Giving Analysis Tab */}
              <TabPanel p={0} pt={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Giving History</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Flex justify="space-between">
                          <Text color="gray.600">Total Donations:</Text>
                          <Text fontWeight="bold">{donationHistory.donationCount}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">Average Gift:</Text>
                          <Text fontWeight="bold">${donationHistory.averageGiftSize.toLocaleString()}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">Largest Gift:</Text>
                          <Text fontWeight="bold">${donationHistory.largestGift.toLocaleString()}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">First Gift:</Text>
                          <Text fontWeight="bold">
                            {new Date(donationHistory.firstGiftDate).toLocaleDateString()}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">Last Gift:</Text>
                          <Text fontWeight="bold">
                            {new Date(donationHistory.lastGiftDate).toLocaleDateString()}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text color="gray.600">Giving Frequency:</Text>
                          <Badge>{donationHistory.givingFrequency}</Badge>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Yearly Giving Trend</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {Object.entries(donationHistory.yearlyGiving)
                          .sort(([a], [b]) => Number(b) - Number(a))
                          .map(([year, amount]) => (
                            <Box key={year}>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm">{year}</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  ${amount.toLocaleString()}
                                </Text>
                              </Flex>
                              <Progress
                                value={(amount / donationHistory.largestGift) * 100}
                                colorScheme="purple"
                                size="sm"
                                borderRadius="md"
                              />
                            </Box>
                          ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Engagement Tab */}
              <TabPanel p={0} pt={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Engagement Overview</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6}>
                        <Box textAlign="center">
                          <CircularProgress
                            value={engagement.engagementScore}
                            size="120px"
                            color={`${getEngagementColor(engagement.engagementLevel)}.500`}
                            thickness="12px"
                          >
                            <CircularProgressLabel fontSize="2xl" fontWeight="bold">
                              {engagement.engagementScore}
                            </CircularProgressLabel>
                          </CircularProgress>
                          <Text mt={2} fontWeight="bold">
                            Engagement Score
                          </Text>
                          <Badge mt={1} colorScheme={getEngagementColor(engagement.engagementLevel)}>
                            {engagement.engagementLevel.replace('_', ' ')}
                          </Badge>
                        </Box>

                        <Divider />

                        <VStack align="stretch" width="100%" spacing={3}>
                          <Flex justify="space-between" align="center">
                            <Text color="gray.600">Retention Risk:</Text>
                            <Badge colorScheme={getRiskColor(engagement.retentionRisk)} fontSize="md">
                              {engagement.retentionRisk}
                            </Badge>
                          </Flex>

                          <Alert status="info" variant="left-accent">
                            <AlertIcon as={FaLightbulb} />
                            <Box flex="1">
                              <AlertTitle fontSize="sm">Next Best Action</AlertTitle>
                              <AlertDescription fontSize="sm">
                                {engagement.nextBestAction}
                              </AlertDescription>
                            </Box>
                          </Alert>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Recent Activity</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <ActivityItem
                          icon={FaDollarSign}
                          color="green"
                          title="Donation Received"
                          description="$5,000 contribution"
                          date="Dec 15, 2024"
                        />
                        <ActivityItem
                          icon={FaCalendar}
                          color="blue"
                          title="Event Attendance"
                          description="Annual Gala"
                          date="Nov 20, 2024"
                        />
                        <ActivityItem
                          icon={FaEnvelope}
                          color="purple"
                          title="Email Opened"
                          description="November Impact Report"
                          date="Nov 10, 2024"
                        />
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Capacity Tab */}
              <TabPanel p={0} pt={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Giving Capacity Analysis</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box textAlign="center" p={4} bg="purple.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600">
                            Estimated Capacity
                          </Text>
                          <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                            ${givingCapacity.estimatedCapacity.toLocaleString()}
                          </Text>
                          <Badge colorScheme="purple" fontSize="lg" mt={2}>
                            Rating: {givingCapacity.capacityRating}
                          </Badge>
                        </Box>

                        <Divider />

                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between">
                            <Text color="gray.600">Current Annual Giving:</Text>
                            <Text fontWeight="bold">
                              ${Math.round(givingCapacity.currentGiving).toLocaleString()}
                            </Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text color="gray.600">Potential Giving:</Text>
                            <Text fontWeight="bold" color="green.500">
                              ${Math.round(givingCapacity.potentialGiving).toLocaleString()}
                            </Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text color="gray.600">Capacity Gap:</Text>
                            <Text fontWeight="bold" color="orange.500">
                              ${Math.round(givingCapacity.gapAnalysis).toLocaleString()}
                            </Text>
                          </Flex>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Recommended Ask Amounts</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="green.200">
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold">Minimum Ask</Text>
                            <Badge colorScheme="green">Safe</Badge>
                          </Flex>
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            ${givingCapacity.askAmount.minimum.toLocaleString()}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            Based on largest previous gift
                          </Text>
                        </Box>

                        <Box p={4} borderWidth="2px" borderRadius="md" borderColor="purple.400" bg="purple.50">
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold">Target Ask</Text>
                            <Badge colorScheme="purple">Recommended</Badge>
                          </Flex>
                          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                            ${givingCapacity.askAmount.target.toLocaleString()}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            Optimized based on capacity analysis
                          </Text>
                        </Box>

                        <Box p={4} borderWidth="1px" borderRadius="md" borderColor="orange.200">
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold">Stretch Ask</Text>
                            <Badge colorScheme="orange">Aspirational</Badge>
                          </Flex>
                          <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                            ${givingCapacity.askAmount.stretch.toLocaleString()}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            For maximum impact opportunity
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Predictive Insights Tab */}
              <TabPanel p={0} pt={6}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Probability Scores</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Flex justify="space-between" mb={2}>
                            <Text>Retention Probability</Text>
                            <Text fontWeight="bold" color="green.500">
                              {predictiveInsights.retentionProbability}%
                            </Text>
                          </Flex>
                          <Progress
                            value={predictiveInsights.retentionProbability}
                            colorScheme="green"
                            size="sm"
                            borderRadius="md"
                          />
                        </Box>

                        <Box>
                          <Flex justify="space-between" mb={2}>
                            <Text>Upgrade Probability</Text>
                            <Text fontWeight="bold" color="purple.500">
                              {predictiveInsights.upgradeProbability}%
                            </Text>
                          </Flex>
                          <Progress
                            value={predictiveInsights.upgradeProbability}
                            colorScheme="purple"
                            size="sm"
                            borderRadius="md"
                          />
                        </Box>

                        <Box>
                          <Flex justify="space-between" mb={2}>
                            <Text>Churn Risk</Text>
                            <Text fontWeight="bold" color={predictiveInsights.churnRisk > 30 ? 'red.500' : 'green.500'}>
                              {predictiveInsights.churnRisk}%
                            </Text>
                          </Flex>
                          <Progress
                            value={predictiveInsights.churnRisk}
                            colorScheme={predictiveInsights.churnRisk > 30 ? 'red' : 'green'}
                            size="sm"
                            borderRadius="md"
                          />
                        </Box>

                        <Divider />

                        <Box p={3} bg="blue.50" borderRadius="md">
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            5-Year Projected Value
                          </Text>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            ${predictiveInsights.lifetimeValueProjection.toLocaleString()}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg}>
                    <CardHeader>
                      <Heading size="sm">Next Gift Prediction</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box textAlign="center" p={6} bg="purple.50" borderRadius="lg">
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            Predicted Gift Amount
                          </Text>
                          <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                            ${predictiveInsights.nextGiftPrediction.amount.toLocaleString()}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={4}>
                            Expected in
                          </Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {predictiveInsights.nextGiftPrediction.timeframe}
                          </Text>
                          <Badge mt={3} colorScheme="purple">
                            {predictiveInsights.nextGiftPrediction.confidence}% confidence
                          </Badge>
                        </Box>

                        <Divider />

                        <Box>
                          <Text fontWeight="bold" mb={3}>
                            <Icon as={FaLightbulb} color="yellow.500" mr={2} />
                            Recommended Actions
                          </Text>
                          <VStack align="stretch" spacing={2}>
                            {predictiveInsights.recommendedActions.map((action, idx) => (
                              <Alert key={idx} status="info" variant="left-accent">
                                <AlertIcon />
                                <AlertDescription fontSize="sm">{action}</AlertDescription>
                              </Alert>
                            ))}
                          </VStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </TabPanel>

              {/* Action Items Tab */}
              <TabPanel p={0} pt={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="sm">Action Items</Heading>
                      <Button size="sm" colorScheme="purple">
                        Add Action
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      {actionItems.map(action => (
                        <Box
                          key={action.actionId}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          borderLeftWidth="4px"
                          borderLeftColor={`${getPriorityColor(action.priority)}.500`}
                        >
                          <Flex justify="space-between" align="start">
                            <VStack align="start" spacing={2} flex="1">
                              <HStack>
                                <Badge colorScheme={getPriorityColor(action.priority)}>
                                  {action.priority}
                                </Badge>
                                <Badge>{action.type}</Badge>
                              </HStack>
                              <Text fontWeight="bold">{action.description}</Text>
                              <HStack fontSize="sm" color="gray.600">
                                <Icon as={FaCalendar} />
                                <Text>Due: {new Date(action.dueDate).toLocaleDateString()}</Text>
                              </HStack>
                            </VStack>
                            <Button size="sm" colorScheme="purple">
                              Complete
                            </Button>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
}

// Helper Component
interface ActivityItemProps {
  icon: any;
  color: string;
  title: string;
  description: string;
  date: string;
}

function ActivityItem({ icon, color, title, description, date }: ActivityItemProps) {
  return (
    <Flex align="center" p={3} borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.700' }}>
      <Flex
        w={10}
        h={10}
        align="center"
        justify="center"
        borderRadius="full"
        bg={`${color}.100`}
        color={`${color}.600`}
        mr={3}
      >
        <Icon as={icon} />
      </Flex>
      <Box flex="1">
        <Text fontWeight="medium" fontSize="sm">
          {title}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {description}
        </Text>
      </Box>
      <Text fontSize="xs" color="gray.500">
        {date}
      </Text>
    </Flex>
  );
}
