/**
 * Smart Assessment Wizard 2.0
 * AI-powered question routing, multi-user collaboration, auto-save, real-time benchmarks
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Progress,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  CheckboxGroup,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
  Avatar,
  AvatarGroup,
  Tooltip,
  useToast,
  useColorModeValue,
  Divider,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaSave,
  FaUsers,
  FaComment,
  FaChartBar,
  FaLightbulb,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';

// Types
interface AssessmentQuestion {
  questionId: string;
  section: string;
  text: string;
  description?: string;
  type: 'scale' | 'multiple_choice' | 'yes_no' | 'text' | 'number' | 'multi_select';
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { [key: number]: string };
  required: boolean;
  helpText?: string;
}

interface AssessmentResponse {
  questionId: string;
  value: any;
  submittedAt: Date;
  submittedBy: string;
}

interface BenchmarkData {
  yourScore: number;
  peerAverage: number;
  topQuartile: number;
  percentile: number;
  comparison: 'above' | 'average' | 'below';
}

interface ActiveUser {
  userId: string;
  userName: string;
  color: string;
  currentQuestionId?: string;
}

interface SectionRecommendation {
  type: 'strength' | 'weakness' | 'opportunity' | 'quick_win';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

export default function SmartAssessmentWizard() {
  // State
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, AssessmentResponse>>(new Map());
  const [currentValue, setCurrentValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentSection, setCurrentSection] = useState('');
  const [sectionProgress, setSectionProgress] = useState<{[key: string]: number}>({});

  // Collaboration state
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [questionLocked, setQuestionLocked] = useState<{ locked: boolean; lockedBy?: string }>(
    { locked: false }
  );

  // Benchmarking state
  const [sectionBenchmark, setSectionBenchmark] = useState<BenchmarkData | null>(null);
  const [showBenchmark, setShowBenchmark] = useState(false);

  // Recommendations state
  const [sectionRecommendations, setSectionRecommendations] = useState<SectionRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Refs
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Initialize assessment
  useEffect(() => {
    initializeAssessment();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // Auto-save on value change
  useEffect(() => {
    if (currentQuestion && currentValue !== null && currentValue !== undefined) {
      scheduleAutoSave();
    }
  }, [currentValue]);

  const initializeAssessment = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // Check IndexedDB for saved progress first
      const savedProgress = await loadFromIndexedDB();

      if (savedProgress) {
        // Resume from saved progress
        setResponses(new Map(savedProgress.responses));
        setCurrentQuestionIndex(savedProgress.currentQuestionIndex);
        setCompletionPercentage(savedProgress.completionPercentage);
        setCurrentSection(savedProgress.currentSection);

        toast({
          title: 'Progress Restored',
          description: 'Your previous session was recovered',
          status: 'success',
          duration: 3000,
        });
      }

      // Load next question
      await loadNextQuestion();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load assessment',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async () => {
    // In production, call API with AI routing
    // For now, use mock data
    const mockQuestion: AssessmentQuestion = {
      questionId: `q_${currentQuestionIndex + 1}`,
      section: 'Organizational Capacity',
      text: 'How would you rate your organization\'s strategic planning capabilities?',
      description: 'Consider your ability to set long-term goals, develop action plans, and adapt to changing circumstances.',
      type: 'scale',
      scaleMin: 1,
      scaleMax: 5,
      scaleLabels: {
        1: 'No formal planning',
        2: 'Basic planning',
        3: 'Structured planning',
        4: 'Advanced planning',
        5: 'Strategic excellence',
      },
      required: true,
      helpText: 'Be honest in your assessment - this helps us provide better recommendations.',
    };

    setCurrentQuestion(mockQuestion);
    setCurrentSection(mockQuestion.section);

    // Check for existing response
    const existingResponse = responses.get(mockQuestion.questionId);
    if (existingResponse) {
      setCurrentValue(existingResponse.value);
    } else {
      setCurrentValue(null);
    }
  };

  const connectWebSocket = () => {
    // In production, connect to WebSocket server for real-time collaboration
    // Mock implementation
    const mockUsers: ActiveUser[] = [
      {
        userId: 'user_1',
        userName: 'John Smith',
        color: '#3182CE',
      },
      {
        userId: 'user_2',
        userName: 'Sarah Johnson',
        color: '#D53F8C',
        currentQuestionId: 'q_5',
      },
    ];

    setActiveUsers(mockUsers);
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      await autoSave();
    }, 2000); // Auto-save 2 seconds after last change
  };

  const autoSave = async () => {
    if (!currentQuestion || currentValue === null) return;

    setSaving(true);

    try {
      const response: AssessmentResponse = {
        questionId: currentQuestion.questionId,
        value: currentValue,
        submittedAt: new Date(),
        submittedBy: 'current_user', // In production, get from auth
      };

      // Update local state
      const newResponses = new Map(responses);
      newResponses.set(currentQuestion.questionId, response);
      setResponses(newResponses);

      // Save to IndexedDB
      await saveToIndexedDB({
        responses: Array.from(newResponses.entries()),
        currentQuestionIndex,
        completionPercentage,
        currentSection,
        lastSaved: new Date(),
      });

      // In production, also save to backend via API

      toast({
        title: 'Auto-saved',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    // Validate required question
    if (currentQuestion.required && (currentValue === null || currentValue === '')) {
      toast({
        title: 'Answer Required',
        description: 'Please answer this question before continuing',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Save current answer
    await autoSave();

    // Check if section is complete
    const sectionQuestions = 20; // In production, get from API
    const sectionResponses = Array.from(responses.values()).filter(r => {
      // In production, filter by section
      return true;
    }).length;

    if (sectionResponses >= sectionQuestions) {
      // Section complete - show recommendations
      await generateSectionRecommendations();
      await loadSectionBenchmark();
      setShowRecommendations(true);
      setShowBenchmark(true);
    }

    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    setCompletionPercentage(Math.round((responses.size / 200) * 100));
    await loadNextQuestion();
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      loadNextQuestion();
    }
  };

  const generateSectionRecommendations = async () => {
    // In production, call API for AI-generated recommendations
    const mockRecommendations: SectionRecommendation[] = [
      {
        type: 'strength',
        title: 'Strong Strategic Planning',
        description: 'Your organization demonstrates excellent strategic planning capabilities, scoring in the top 20% of peer organizations.',
        priority: 'high',
        estimatedImpact: 'Maintain current practices',
      },
      {
        type: 'weakness',
        title: 'Limited Technology Infrastructure',
        description: 'Consider investing in modern technology tools to improve operational efficiency.',
        priority: 'high',
        estimatedImpact: '25% efficiency improvement',
      },
      {
        type: 'quick_win',
        title: 'Implement Monthly Dashboards',
        description: 'Create simple KPI dashboards to track progress on strategic goals.',
        priority: 'medium',
        estimatedImpact: '2-3 hours to implement',
      },
    ];

    setSectionRecommendations(mockRecommendations);
  };

  const loadSectionBenchmark = async () => {
    // In production, call API for real-time benchmarking
    const mockBenchmark: BenchmarkData = {
      yourScore: 78,
      peerAverage: 65,
      topQuartile: 82,
      percentile: 72,
      comparison: 'above',
    };

    setSectionBenchmark(mockBenchmark);
  };

  const saveToIndexedDB = async (data: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NonprofitAssessment', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['assessments'], 'readwrite');
        const store = transaction.objectStore('assessments');

        store.put({ id: 'current_assessment', ...data });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('assessments')) {
          db.createObjectStore('assessments', { keyPath: 'id' });
        }
      };
    });
  };

  const loadFromIndexedDB = async (): Promise<any | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('NonprofitAssessment', 1);

      request.onerror = () => resolve(null);

      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('assessments')) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(['assessments'], 'readonly');
        const store = transaction.objectStore('assessments');
        const getRequest = store.get('current_assessment');

        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };

        getRequest.onerror = () => resolve(null);
      };

      request.onupgradeneeded = () => resolve(null);
    });
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'scale':
        return (
          <VStack spacing={4} align="stretch">
            <Slider
              value={currentValue || currentQuestion.scaleMin || 1}
              min={currentQuestion.scaleMin || 1}
              max={currentQuestion.scaleMax || 5}
              step={1}
              onChange={setCurrentValue}
              isDisabled={questionLocked.locked}
            >
              <SliderTrack>
                <SliderFilledTrack bg="purple.500" />
              </SliderTrack>
              <SliderThumb boxSize={6}>
                <Box color="purple.500" fontSize="xs" fontWeight="bold">
                  {currentValue || currentQuestion.scaleMin || 1}
                </Box>
              </SliderThumb>
            </Slider>

            {currentQuestion.scaleLabels && (
              <HStack justify="space-between" fontSize="sm" color="gray.600">
                {Object.entries(currentQuestion.scaleLabels).map(([key, label]) => (
                  <Text key={key} maxW="100px" textAlign="center">
                    {label}
                  </Text>
                ))}
              </HStack>
            )}
          </VStack>
        );

      case 'multiple_choice':
        return (
          <RadioGroup value={currentValue} onChange={setCurrentValue} isDisabled={questionLocked.locked}>
            <Stack spacing={3}>
              {currentQuestion.options?.map((option, index) => (
                <Radio key={index} value={option} colorScheme="purple">
                  {option}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        );

      case 'yes_no':
        return (
          <RadioGroup value={currentValue} onChange={setCurrentValue} isDisabled={questionLocked.locked}>
            <Stack direction="row" spacing={6}>
              <Radio value="yes" colorScheme="purple">Yes</Radio>
              <Radio value="no" colorScheme="purple">No</Radio>
            </Stack>
          </RadioGroup>
        );

      case 'text':
        return (
          <Textarea
            value={currentValue || ''}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="Enter your response..."
            rows={4}
            isDisabled={questionLocked.locked}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue || ''}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="Enter a number..."
            isDisabled={questionLocked.locked}
          />
        );

      case 'multi_select':
        return (
          <CheckboxGroup value={currentValue || []} onChange={setCurrentValue} isDisabled={questionLocked.locked}>
            <Stack spacing={3}>
              {currentQuestion.options?.map((option, index) => (
                <Checkbox key={index} value={option} colorScheme="purple">
                  {option}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        );

      default:
        return null;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'strength': return FaCheck;
      case 'weakness': return FaExclamationTriangle;
      case 'opportunity': return FaLightbulb;
      case 'quick_win': return FaLightbulb;
      default: return FaInfoCircle;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'strength': return 'green';
      case 'weakness': return 'orange';
      case 'opportunity': return 'blue';
      case 'quick_win': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading assessment...</Text>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.lg">
        <VStack spacing={6} align="stretch">
          {/* Header with Progress */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Heading size="md">{currentSection}</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Question {currentQuestionIndex + 1} of 200
                    </Text>
                  </VStack>

                  {/* Active Users */}
                  <HStack>
                    <Tooltip label="Active collaborators">
                      <Box>
                        <AvatarGroup size="sm" max={3}>
                          {activeUsers.map(user => (
                            <Avatar
                              key={user.userId}
                              name={user.userName}
                              bg={user.color}
                              size="sm"
                            />
                          ))}
                        </AvatarGroup>
                      </Box>
                    </Tooltip>

                    {saving && (
                      <HStack spacing={2}>
                        <Icon as={FaSave} color="green.500" />
                        <Text fontSize="sm" color="green.500">Saving...</Text>
                      </HStack>
                    )}
                  </HStack>
                </Flex>

                <Progress
                  value={completionPercentage}
                  colorScheme="purple"
                  size="sm"
                  borderRadius="md"
                />
                <Text fontSize="sm" color="gray.600">
                  {completionPercentage}% Complete
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Main Question Card */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <VStack align="start" spacing={3}>
                  <Heading size="md">{currentQuestion?.text}</Heading>

                  {currentQuestion?.description && (
                    <Text color="gray.600">{currentQuestion.description}</Text>
                  )}

                  {currentQuestion?.required && (
                    <Badge colorScheme="red">Required</Badge>
                  )}

                  {questionLocked.locked && (
                    <Alert status="warning">
                      <AlertIcon />
                      <AlertDescription>
                        {questionLocked.lockedBy} is currently editing this question
                      </AlertDescription>
                    </Alert>
                  )}
                </VStack>

                {/* Question Input */}
                {renderQuestionInput()}

                {/* Help Text */}
                {currentQuestion?.helpText && (
                  <Alert status="info" variant="left-accent">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">
                      {currentQuestion.helpText}
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation */}
          <Flex justify="space-between">
            <Button
              leftIcon={<FaChevronLeft />}
              onClick={handlePrevious}
              isDisabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>

            <Button
              rightIcon={<FaChevronRight />}
              onClick={handleNext}
              colorScheme="purple"
            >
              Next Question
            </Button>
          </Flex>

          {/* Section Benchmark */}
          {showBenchmark && sectionBenchmark && (
            <Card bg={cardBg}>
              <CardHeader>
                <HStack>
                  <Icon as={FaChartBar} color="blue.500" />
                  <Heading size="sm">Section Benchmark</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between">
                    <Text fontWeight="bold">Your Score:</Text>
                    <Badge colorScheme="purple" fontSize="lg">{sectionBenchmark.yourScore}</Badge>
                  </Flex>

                  <Flex justify="space-between">
                    <Text>Peer Average:</Text>
                    <Text>{sectionBenchmark.peerAverage}</Text>
                  </Flex>

                  <Flex justify="space-between">
                    <Text>Top Quartile:</Text>
                    <Text>{sectionBenchmark.topQuartile}</Text>
                  </Flex>

                  <Flex justify="space-between">
                    <Text>Your Percentile:</Text>
                    <Badge colorScheme={sectionBenchmark.percentile >= 75 ? 'green' : 'blue'}>
                      {sectionBenchmark.percentile}th
                    </Badge>
                  </Flex>

                  <Alert status={sectionBenchmark.comparison === 'above' ? 'success' : 'info'}>
                    <AlertIcon />
                    <AlertDescription>
                      You are performing {sectionBenchmark.comparison === 'above' ? 'above' : 'at'} peer average
                    </AlertDescription>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Section Recommendations */}
          {showRecommendations && sectionRecommendations.length > 0 && (
            <Card bg={cardBg}>
              <CardHeader>
                <HStack>
                  <Icon as={FaLightbulb} color="yellow.500" />
                  <Heading size="sm">Instant Recommendations</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {sectionRecommendations.map((rec, index) => (
                    <Alert
                      key={index}
                      status={rec.type === 'strength' ? 'success' : 'info'}
                      variant="left-accent"
                    >
                      <AlertIcon as={getRecommendationIcon(rec.type)} />
                      <Box flex="1">
                        <AlertTitle>{rec.title}</AlertTitle>
                        <AlertDescription display="block">
                          {rec.description}
                          <Badge ml={2} colorScheme={getRecommendationColor(rec.type)}>
                            {rec.estimatedImpact}
                          </Badge>
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
