/**
 * Compliance Command Center
 * Visual calendar, automated filing reminders, penalty calculator, deadline management
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
  Grid,
  GridItem,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Flex,
  Divider,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  FormControl,
  FormLabel,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  Progress,
} from '@chakra-ui/react';
import {
  FaCalendar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaBell,
  FaCalculator,
  FaDownload,
  FaUpload,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

interface ComplianceRequirement {
  requirementId: string;
  title: string;
  type: 'federal' | 'state' | 'local';
  category: 'tax' | 'registration' | 'reporting' | 'license';
  dueDate: Date;
  status: 'compliant' | 'upcoming' | 'overdue' | 'pending';
  priority: 'critical' | 'high' | 'medium' | 'low';
  jurisdiction: string;
  description: string;
  requiredDocuments: string[];
  penalties?: {
    lateFilingFee: number;
    dailyPenalty?: number;
    maxPenalty?: number;
    revocationRisk: boolean;
  };
  filingUrl?: string;
  estimatedCost?: number;
  recurringFrequency?: 'annual' | 'quarterly' | 'monthly';
}

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  requirements: ComplianceRequirement[];
}

export default function ComplianceCommandCenter() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPenaltyCalcOpen,
    onOpen: onPenaltyCalcOpen,
    onClose: onPenaltyCalcClose,
  } = useDisclosure();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    loadRequirements();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentMonth, requirements]);

  const loadRequirements = async () => {
    // In production, fetch from API
    const mockRequirements: ComplianceRequirement[] = [
      {
        requirementId: 'req_001',
        title: 'Form 990 - Annual Return',
        type: 'federal',
        category: 'tax',
        dueDate: new Date('2025-05-15'),
        status: 'upcoming',
        priority: 'critical',
        jurisdiction: 'IRS',
        description: 'Annual information return for tax-exempt organizations',
        requiredDocuments: ['Financial statements', 'Program summaries', 'Board roster'],
        penalties: {
          lateFilingFee: 20,
          dailyPenalty: 20,
          maxPenalty: 10500,
          revocationRisk: true,
        },
        filingUrl: 'https://www.irs.gov/e-file-providers',
        estimatedCost: 0,
        recurringFrequency: 'annual',
      },
      {
        requirementId: 'req_002',
        title: 'California Charitable Registration',
        type: 'state',
        category: 'registration',
        dueDate: new Date('2025-04-30'),
        status: 'upcoming',
        priority: 'high',
        jurisdiction: 'California',
        description: 'Annual charitable registration renewal',
        requiredDocuments: ['Form RRF-1', 'Form 990', 'Financial statements'],
        penalties: {
          lateFilingFee: 50,
          revocationRisk: true,
        },
        filingUrl: 'https://rct.doj.ca.gov/Verification/Web/Search.aspx',
        estimatedCost: 50,
        recurringFrequency: 'annual',
      },
      {
        requirementId: 'req_003',
        title: 'Quarterly 941 - Payroll Taxes',
        type: 'federal',
        category: 'tax',
        dueDate: new Date('2025-04-30'),
        status: 'upcoming',
        priority: 'high',
        jurisdiction: 'IRS',
        description: 'Employer\'s quarterly federal tax return',
        requiredDocuments: ['Payroll records', 'Tax deposits'],
        penalties: {
          lateFilingFee: 250,
          dailyPenalty: 5,
          revocationRisk: false,
        },
        filingUrl: 'https://www.irs.gov/forms-pubs/about-form-941',
        estimatedCost: 0,
        recurringFrequency: 'quarterly',
      },
      {
        requirementId: 'req_004',
        title: 'Business License Renewal',
        type: 'local',
        category: 'license',
        dueDate: new Date('2025-03-31'),
        status: 'overdue',
        priority: 'critical',
        jurisdiction: 'City of Los Angeles',
        description: 'Annual business license renewal',
        requiredDocuments: ['Renewal application', 'Proof of insurance'],
        penalties: {
          lateFilingFee: 100,
          dailyPenalty: 10,
          maxPenalty: 500,
          revocationRisk: true,
        },
        estimatedCost: 125,
        recurringFrequency: 'annual',
      },
    ];

    setRequirements(mockRequirements);
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get starting day (Sunday)
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      days.push({
        date,
        isToday: isToday(date),
        isCurrentMonth: false,
        requirements: getRequirementsForDate(date),
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isToday: isToday(date),
        isCurrentMonth: true,
        requirements: getRequirementsForDate(date),
      });
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isToday: isToday(date),
        isCurrentMonth: false,
        requirements: getRequirementsForDate(date),
      });
    }

    setCalendarDays(days);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getRequirementsForDate = (date: Date): ComplianceRequirement[] => {
    return requirements.filter(req => {
      const reqDate = new Date(req.dueDate);
      return (
        reqDate.getDate() === date.getDate() &&
        reqDate.getMonth() === date.getMonth() &&
        reqDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getDaysUntilDue = (dueDate: Date): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculatePenalty = (requirement: ComplianceRequirement): number => {
    if (!requirement.penalties || requirement.status !== 'overdue') {
      return 0;
    }

    const daysOverdue = Math.abs(getDaysUntilDue(requirement.dueDate));
    let penalty = requirement.penalties.lateFilingFee || 0;

    if (requirement.penalties.dailyPenalty) {
      penalty += daysOverdue * requirement.penalties.dailyPenalty;
    }

    if (requirement.penalties.maxPenalty) {
      penalty = Math.min(penalty, requirement.penalties.maxPenalty);
    }

    return penalty;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'green';
      case 'upcoming': return 'blue';
      case 'overdue': return 'red';
      case 'pending': return 'orange';
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

  const filteredRequirements = requirements.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterType !== 'all' && req.type !== filterType) return false;
    return true;
  });

  const overdueCount = requirements.filter(r => r.status === 'overdue').length;
  const upcomingCount = requirements.filter(r => {
    const daysUntil = getDaysUntilDue(r.dueDate);
    return r.status === 'upcoming' && daysUntil <= 30;
  }).length;
  const compliantCount = requirements.filter(r => r.status === 'compliant').length;
  const totalPenalties = requirements.reduce((sum, r) => sum + calculatePenalty(r), 0);

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">Compliance Command Center</Heading>
            <HStack>
              <Button leftIcon={<FaCalculator />} onClick={onPenaltyCalcOpen} size="sm">
                Penalty Calculator
              </Button>
              <Button leftIcon={<FaDownload />} colorScheme="purple" size="sm">
                Export Report
              </Button>
            </HStack>
          </Flex>

          {/* Status Overview */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card bg={cardBg}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" boxSize={5} />
                    <Text fontSize="sm" color="gray.600">Compliant</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold">{compliantCount}</Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaBell} color="blue.500" boxSize={5} />
                    <Text fontSize="sm" color="gray.600">Upcoming (30 days)</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold">{upcomingCount}</Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaExclamationTriangle} color="red.500" boxSize={5} />
                    <Text fontSize="sm" color="gray.600">Overdue</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="red.500">
                    {overdueCount}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaCalculator} color="orange.500" boxSize={5} />
                    <Text fontSize="sm" color="gray.600">Total Penalties</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    ${totalPenalties.toLocaleString()}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Overdue Alerts */}
          {overdueCount > 0 && (
            <Alert status="error">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Urgent Action Required!</AlertTitle>
                <AlertDescription>
                  You have {overdueCount} overdue requirement{overdueCount > 1 ? 's' : ''} with
                  total penalties of ${totalPenalties.toLocaleString()}
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <Tabs>
            <TabList>
              <Tab>
                <HStack>
                  <Icon as={FaCalendar} />
                  <Text>Calendar View</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Icon as={FaFileAlt} />
                  <Text>List View</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Calendar View */}
              <TabPanel p={0} pt={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<FaChevronLeft />}
                        onClick={() => navigateMonth('prev')}
                      >
                        Previous
                      </Button>

                      <Heading size="md">
                        {currentMonth.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Heading>

                      <Button
                        size="sm"
                        variant="ghost"
                        rightIcon={<FaChevronRight />}
                        onClick={() => navigateMonth('next')}
                      >
                        Next
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns="repeat(7, 1fr)" gap={2}>
                      {/* Day headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <GridItem key={day}>
                          <Text
                            textAlign="center"
                            fontWeight="bold"
                            fontSize="sm"
                            color="gray.600"
                          >
                            {day}
                          </Text>
                        </GridItem>
                      ))}

                      {/* Calendar days */}
                      {calendarDays.map((day, index) => (
                        <GridItem key={index}>
                          <Box
                            p={2}
                            minH="100px"
                            borderWidth="1px"
                            borderRadius="md"
                            bg={
                              day.isToday
                                ? 'purple.50'
                                : !day.isCurrentMonth
                                ? 'gray.50'
                                : 'white'
                            }
                            _dark={{
                              bg: day.isToday
                                ? 'purple.900'
                                : !day.isCurrentMonth
                                ? 'gray.800'
                                : 'gray.700',
                            }}
                          >
                            <Text
                              fontSize="sm"
                              fontWeight={day.isToday ? 'bold' : 'normal'}
                              color={!day.isCurrentMonth ? 'gray.400' : 'inherit'}
                            >
                              {day.date.getDate()}
                            </Text>

                            <VStack spacing={1} mt={1} align="stretch">
                              {day.requirements.slice(0, 3).map(req => (
                                <Tooltip key={req.requirementId} label={req.title}>
                                  <Badge
                                    colorScheme={getStatusColor(req.status)}
                                    fontSize="xs"
                                    cursor="pointer"
                                    onClick={() => {
                                      setSelectedRequirement(req);
                                      onOpen();
                                    }}
                                    isTruncated
                                  >
                                    {req.title.substring(0, 15)}
                                  </Badge>
                                </Tooltip>
                              ))}
                              {day.requirements.length > 3 && (
                                <Text fontSize="xs" color="gray.500">
                                  +{day.requirements.length - 3} more
                                </Text>
                              )}
                            </VStack>
                          </Box>
                        </GridItem>
                      ))}
                    </Grid>
                  </CardBody>
                </Card>
              </TabPanel>

              {/* List View */}
              <TabPanel p={0} pt={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <HStack spacing={4}>
                      <FormControl maxW="200px">
                        <Select
                          value={filterStatus}
                          onChange={e => setFilterStatus(e.target.value)}
                          size="sm"
                        >
                          <option value="all">All Statuses</option>
                          <option value="compliant">Compliant</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="overdue">Overdue</option>
                          <option value="pending">Pending</option>
                        </Select>
                      </FormControl>

                      <FormControl maxW="200px">
                        <Select
                          value={filterType}
                          onChange={e => setFilterType(e.target.value)}
                          size="sm"
                        >
                          <option value="all">All Types</option>
                          <option value="federal">Federal</option>
                          <option value="state">State</option>
                          <option value="local">Local</option>
                        </Select>
                      </FormControl>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Requirement</Th>
                          <Th>Jurisdiction</Th>
                          <Th>Due Date</Th>
                          <Th>Status</Th>
                          <Th>Priority</Th>
                          <Th>Penalty</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredRequirements.map(req => {
                          const daysUntil = getDaysUntilDue(req.dueDate);
                          const penalty = calculatePenalty(req);

                          return (
                            <Tr key={req.requirementId}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium">{req.title}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {req.category}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge>{req.jurisdiction}</Badge>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm">
                                    {new Date(req.dueDate).toLocaleDateString()}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {daysUntil > 0
                                      ? `${daysUntil} days`
                                      : `${Math.abs(daysUntil)} days overdue`}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(req.status)}>
                                  {req.status}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={getPriorityColor(req.priority)}>
                                  {req.priority}
                                </Badge>
                              </Td>
                              <Td>
                                {penalty > 0 && (
                                  <Text color="red.500" fontWeight="bold">
                                    ${penalty.toLocaleString()}
                                  </Text>
                                )}
                              </Td>
                              <Td>
                                <Button
                                  size="xs"
                                  onClick={() => {
                                    setSelectedRequirement(req);
                                    onOpen();
                                  }}
                                >
                                  View Details
                                </Button>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Requirement Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedRequirement?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRequirement && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Badge colorScheme={getStatusColor(selectedRequirement.status)}>
                    {selectedRequirement.status}
                  </Badge>
                  <Badge colorScheme={getPriorityColor(selectedRequirement.priority)}>
                    {selectedRequirement.priority}
                  </Badge>
                  <Badge>{selectedRequirement.jurisdiction}</Badge>
                </HStack>

                <Text>{selectedRequirement.description}</Text>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Due Date
                  </Text>
                  <Text>
                    {new Date(selectedRequirement.dueDate).toLocaleDateString()} (
                    {getDaysUntilDue(selectedRequirement.dueDate) > 0
                      ? `${getDaysUntilDue(selectedRequirement.dueDate)} days remaining`
                      : `${Math.abs(getDaysUntilDue(selectedRequirement.dueDate))} days overdue`}
                    )
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Required Documents
                  </Text>
                  <VStack align="start" spacing={1}>
                    {selectedRequirement.requiredDocuments.map((doc, idx) => (
                      <HStack key={idx}>
                        <Icon as={FaFileAlt} color="blue.500" />
                        <Text fontSize="sm">{doc}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                {selectedRequirement.penalties && (
                  <Alert status="warning">
                    <AlertIcon />
                    <Box flex="1">
                      <AlertTitle>Penalties</AlertTitle>
                      <AlertDescription>
                        <VStack align="start" spacing={1} mt={2}>
                          <Text>Late filing fee: ${selectedRequirement.penalties.lateFilingFee}</Text>
                          {selectedRequirement.penalties.dailyPenalty && (
                            <Text>
                              Daily penalty: ${selectedRequirement.penalties.dailyPenalty}/day
                            </Text>
                          )}
                          {selectedRequirement.penalties.maxPenalty && (
                            <Text>Maximum penalty: ${selectedRequirement.penalties.maxPenalty}</Text>
                          )}
                          {selectedRequirement.penalties.revocationRisk && (
                            <Text color="red.500" fontWeight="bold">
                              Risk of license/status revocation
                            </Text>
                          )}
                          {calculatePenalty(selectedRequirement) > 0 && (
                            <Text fontSize="lg" fontWeight="bold" color="red.500" mt={2}>
                              Current penalty: ${calculatePenalty(selectedRequirement).toLocaleString()}
                            </Text>
                          )}
                        </VStack>
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button leftIcon={<FaUpload />} variant="outline">
                Upload Documents
              </Button>
              {selectedRequirement?.filingUrl && (
                <Button
                  as="a"
                  href={selectedRequirement.filingUrl}
                  target="_blank"
                  colorScheme="purple"
                >
                  File Online
                </Button>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Penalty Calculator Modal */}
      <Modal isOpen={isPenaltyCalcOpen} onClose={onPenaltyCalcClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FaCalculator} />
              <Text>Penalty Calculator</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <AlertDescription>
                  Estimate potential penalties for late filings based on your requirements
                </AlertDescription>
              </Alert>

              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Requirement</Th>
                    <Th isNumeric>Days Late</Th>
                    <Th isNumeric>Penalty</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {requirements
                    .filter(r => r.penalties)
                    .map(req => {
                      const penalty = calculatePenalty(req);
                      const daysLate =
                        req.status === 'overdue'
                          ? Math.abs(getDaysUntilDue(req.dueDate))
                          : 0;

                      return (
                        <Tr key={req.requirementId}>
                          <Td>{req.title}</Td>
                          <Td isNumeric>{daysLate}</Td>
                          <Td isNumeric fontWeight="bold" color={penalty > 0 ? 'red.500' : 'inherit'}>
                            ${penalty.toLocaleString()}
                          </Td>
                        </Tr>
                      );
                    })}
                </Tbody>
              </Table>

              <Divider />

              <Flex justify="space-between" align="center" p={4} bg="red.50" borderRadius="md">
                <Text fontWeight="bold">Total Estimated Penalties:</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  ${totalPenalties.toLocaleString()}
                </Text>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onPenaltyCalcClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
