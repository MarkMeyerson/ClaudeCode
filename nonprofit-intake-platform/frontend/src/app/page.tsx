/**
 * Main Landing Page for Non-Profit Intake Platform
 * Welcome page with organization type selector and platform overview
 */

'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
  Badge,
  Stack,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  FaChartLine,
  FaCheckCircle,
  FaUsers,
  FaFlag,
  FaHeart,
  FaBriefcase,
  FaLandmark,
  FaRocket,
  FaShieldAlt,
  FaChartBar,
} from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const handleGetStarted = (orgType: string) => {
    router.push(`/intake?type=${orgType}`);
  };

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        color="white"
        py={20}
      >
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading size="2xl" fontWeight="bold">
              Transform Your Non-Profit Organization
            </Heading>
            <Text fontSize="xl" maxW="3xl">
              The comprehensive platform for organizational assessment, compliance tracking,
              and capacity building. Trusted by 10,000+ non-profits, associations, and PACs.
            </Text>
            <HStack spacing={4} pt={4}>
              <Button
                size="lg"
                colorScheme="white"
                variant="solid"
                onClick={() => router.push('/register')}
                leftIcon={<Icon as={FaRocket} />}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => router.push('/demo')}
              >
                Watch Demo
              </Button>
            </HStack>
            <HStack spacing={8} pt={6}>
              <HStack>
                <Icon as={FaCheckCircle} />
                <Text>Free 30-day trial</Text>
              </HStack>
              <HStack>
                <Icon as={FaCheckCircle} />
                <Text>No credit card required</Text>
              </HStack>
              <HStack>
                <Icon as={FaCheckCircle} />
                <Text>Cancel anytime</Text>
              </HStack>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Organization Types Section */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <VStack spacing={2} textAlign="center">
            <Heading size="xl">Choose Your Organization Track</Heading>
            <Text fontSize="lg" color="gray.600">
              Specialized assessments and tools designed for your organization type
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
            {/* Mission-Driven Organizations */}
            <Box
              bg={cardBg}
              p={8}
              borderRadius="lg"
              boxShadow="lg"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <VStack spacing={4} align="start">
                <Flex
                  w={16}
                  h={16}
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bg="purple.100"
                  color="purple.600"
                >
                  <Icon as={FaHeart} boxSize={8} />
                </Flex>
                <Badge colorScheme="purple" fontSize="sm">
                  501(c)(3) Organizations
                </Badge>
                <Heading size="md">Mission-Driven Organizations</Heading>
                <Text color="gray.600">
                  For charities, foundations, and non-profits focused on social impact
                </Text>
                <VStack align="start" spacing={2} fontSize="sm">
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Program effectiveness assessment</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Impact measurement frameworks</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Donor management tools</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Grant readiness evaluation</Text>
                  </HStack>
                </VStack>
                <Button
                  colorScheme="purple"
                  w="full"
                  onClick={() => handleGetStarted('mission_driven')}
                >
                  Start Mission-Driven Track
                </Button>
              </VStack>
            </Box>

            {/* Associations */}
            <Box
              bg={cardBg}
              p={8}
              borderRadius="lg"
              boxShadow="lg"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <VStack spacing={4} align="start">
                <Flex
                  w={16}
                  h={16}
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bg="blue.100"
                  color="blue.600"
                >
                  <Icon as={FaBriefcase} boxSize={8} />
                </Flex>
                <Badge colorScheme="blue" fontSize="sm">
                  501(c)(6) Organizations
                </Badge>
                <Heading size="md">Professional & Trade Associations</Heading>
                <Text color="gray.600">
                  For membership organizations serving industries and professions
                </Text>
                <VStack align="start" spacing={2} fontSize="sm">
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Member engagement analytics</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Advocacy effectiveness tracking</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Revenue diversification</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Governance optimization</Text>
                  </HStack>
                </VStack>
                <Button
                  colorScheme="blue"
                  w="full"
                  onClick={() => handleGetStarted('association')}
                >
                  Start Association Track
                </Button>
              </VStack>
            </Box>

            {/* PACs */}
            <Box
              bg={cardBg}
              p={8}
              borderRadius="lg"
              boxShadow="lg"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-4px)' }}
            >
              <VStack spacing={4} align="start">
                <Flex
                  w={16}
                  h={16}
                  align="center"
                  justify="center"
                  borderRadius="full"
                  bg="red.100"
                  color="red.600"
                >
                  <Icon as={FaLandmark} boxSize={8} />
                </Flex>
                <Badge colorScheme="red" fontSize="sm">
                  527 & Political Organizations
                </Badge>
                <Heading size="md">Political Action Committees</Heading>
                <Text color="gray.600">
                  For PACs and political organizations navigating campaign finance
                </Text>
                <VStack align="start" spacing={2} fontSize="sm">
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>FEC compliance management</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Donor engagement metrics</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Campaign effectiveness</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>Political strategy tools</Text>
                  </HStack>
                </VStack>
                <Button
                  colorScheme="red"
                  w="full"
                  onClick={() => handleGetStarted('pac')}
                >
                  Start PAC Track
                </Button>
              </VStack>
            </Box>
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Features Section */}
      <Box bg={cardBg} py={16}>
        <Container maxW="container.xl">
          <VStack spacing={12}>
            <VStack spacing={2} textAlign="center">
              <Heading size="xl">Comprehensive Platform Features</Heading>
              <Text fontSize="lg" color="gray.600">
                Everything you need to assess, manage, and grow your organization
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              <FeatureCard
                icon={FaChartLine}
                title="Multi-Dimensional Assessment"
                description="200+ questions across 10 dimensions of organizational health with AI-powered insights"
              />
              <FeatureCard
                icon={FaShieldAlt}
                title="Compliance Tracking"
                description="Federal, state, and local compliance requirements with automated deadline alerts"
              />
              <FeatureCard
                icon={FaUsers}
                title="Capacity Building"
                description="Personalized recommendations and implementation roadmaps for organizational growth"
              />
              <FeatureCard
                icon={FaChartBar}
                title="Benchmarking"
                description="Compare your performance against peers and industry standards"
              />
              <FeatureCard
                icon={FaFlag}
                title="Risk Management"
                description="Identify, assess, and mitigate financial, operational, and compliance risks"
              />
              <FeatureCard
                icon={FaRocket}
                title="AI-Powered Insights"
                description="Machine learning classification, document processing, and predictive analytics"
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxW="container.xl" py={16}>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
          <StatCard number="10,000+" label="Organizations Served" />
          <StatCard number="50,000+" label="Assessments Completed" />
          <StatCard number="98%" label="Compliance Rate" />
          <StatCard number="4.9/5" label="User Satisfaction" />
        </SimpleGrid>
      </Container>

      {/* CTA Section */}
      <Box bg="purple.600" color="white" py={16}>
        <Container maxW="container.md">
          <VStack spacing={6} textAlign="center">
            <Heading size="xl">Ready to Transform Your Organization?</Heading>
            <Text fontSize="lg">
              Join thousands of non-profits using our platform to achieve their missions more effectively
            </Text>
            <Button
              size="lg"
              colorScheme="white"
              variant="solid"
              onClick={() => router.push('/register')}
            >
              Start Your Free Trial
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

// Helper Components
interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="md">
      <VStack align="start" spacing={4}>
        <Flex
          w={12}
          h={12}
          align="center"
          justify="center"
          borderRadius="lg"
          bg="purple.100"
          color="purple.600"
        >
          <Icon as={icon} boxSize={6} />
        </Flex>
        <Heading size="sm">{title}</Heading>
        <Text color="gray.600" fontSize="sm">
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <VStack spacing={2}>
      <Heading size="2xl" color="purple.600">
        {number}
      </Heading>
      <Text color="gray.600" fontWeight="medium">
        {label}
      </Text>
    </VStack>
  );
}
