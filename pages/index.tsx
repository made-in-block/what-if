import Head from 'next/head';
import {
  Box,
  Divider,
  Grid,
  Heading,
  Text,
  Stack,
  Container,
  Link,
  Button,
  Flex,
  Icon,
  useColorMode,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react';
import { BsFillMoonStarsFill, BsFillSunFill } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { bech32 } from 'bech32';

const RPC = "https://rest.cosmos.directory/cosmoshub";

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode();

  const [validators, setValidators] = useState([]);
  const [valClean, setValClean] = useState([]);

  const sortFn = (a, b) => {
    if ( a.power < b.power ){
      return 1;
    }
    if ( a.power > b.power ){
      return -1;
    }
    return 0;
  }

  const formatVP = (vp: number) => {
    return (vp / 1000000).toFixed(2) + " ATOM"
  }

  const getICFDelegations = async () => {
    const addresses = ["cosmos14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh", "cosmos1z8mzakma7vnaajysmtkwt4wgjqr2m84tzvyfkz"]

    let delegations_aggregated = [];

    for (const addr of addresses) {
      const res = await axios.get(`${RPC}/cosmos/staking/v1beta1/delegations/${addr}`)

      const delegations = res.data.delegation_responses;

      for (const delegation of delegations) {
        delegations_aggregated.push({validator_address: delegation.delegation.validator_address, shares: parseFloat(delegation.delegation.shares)})
      }
    }
    return delegations_aggregated
  }

  useEffect(() => {

    const loadData = async () => {
      let ICF = await getICFDelegations();

      let res = await axios.get("https://rest.cosmos.directory/cosmoshub/staking/validators");

      const vals = res.data.result;
      
      let validatorList = [];
      let validatorsClean = [];

      for (const val of vals) {

        let power = parseFloat(val.delegator_shares);

        // Subtract icf delegation
        let icfdel = ICF.find((el) => el.validator_address == val.operator_address) 
        if (icfdel !== undefined) {
          power -= icfdel.shares;
        }

        validatorsClean.push({
          name: val.description.moniker,
          power: parseFloat(val.delegator_shares)
        })

        validatorList.push({
          name: val.description.moniker,
          power: power
        })
      }

      validatorsClean.sort(sortFn)
      console.log("val clean", validatorsClean)
      validatorList.sort(sortFn)

      setValClean(validatorsClean)
      setValidators(validatorList)

    }

    loadData();

  }, []);

  const getOriginalValPosition = (validatorName: string) => {
    return valClean.indexOf(valClean.find((el) => el.name === validatorName))+1
  }

  const formatVPDiff = (original, now) => {

    if (original < now) {
      return (<Text color='tomato'>{original - now}</Text>)
    } else {
      return (<Text color='green'>+{original - now}</Text>)
    }
  }

  return (
    <Container maxW="5xl" py={10}>
      <Head>
        <title>What If? Hub set without ICF Delegation</title>
        <meta name="description" content="Generated by create cosmos app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Flex justifyContent="end" mb={4}>
        <Button variant="outline" px={0} onClick={toggleColorMode}>
          <Icon
            as={colorMode === 'light' ? BsFillMoonStarsFill : BsFillSunFill}
          />
        </Button>
      </Flex>
      <Box textAlign="center">
        <Heading
          as="h1"
          fontSize={{ base: '3xl', sm: '4xl', md: '5xl' }}
          fontWeight="extrabold"
          mb={3}
        >
          What If?
        </Heading>
        <Heading
          as="h1"
          fontWeight="bold"
          fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
        >
          <Text as="span">Cosmos Hub validator set without ICF Delegations</Text>
         
        </Heading>
      </Box>
      
      <TableContainer mt={14}>
        <Table variant='simple'>
          <TableCaption>Cosmos Hub Active Validators</TableCaption>
          <Thead>
            <Tr>
              <Th>#</Th>
              <Th>Diff</Th>
              <Th>Name</Th>
              <Th>Voting Power</Th>
            </Tr>
          </Thead>
          <Tbody>
            {validators.map((el) => {
              return (
              <Tr key={el.name}>
                <Td>{validators.indexOf(el)+1}</Td>
                <Td>{formatVPDiff(getOriginalValPosition(el.name), validators.indexOf(el)+1)}</Td>
                <Td>{el.name}</Td>
                <Td>{formatVP(el.power)}</Td>
              </Tr>
              )
            })}
            </Tbody>
          <Tfoot>
          <Tr>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>Voting Power</Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>

      <Box mb={3}>
        <Divider />
      </Box>
      <Stack
        isInline={true}
        spacing={1}
        justifyContent="center"
        opacity={0.5}
        fontSize="sm"
      >
        <Text>Built with</Text>
        <Link
          href="https://cosmology.tech/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Cosmology
        </Link>
        <Text>| Brought to you by</Text>
        <Link href="https://madeinblock.tech">
          Made In Block
        </Link>
      </Stack>
    </Container>
  );
}