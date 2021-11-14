import React, { useState, useEffect } from 'react';
import {
  Heading,
  Flex,
  Spinner,
  Text,
  Center,
  Container,
  Button,
  Alert,
  AlertIcon,
  useToast,
  Link,
} from '@chakra-ui/react';

const api = 'http://localhost:6975';

const Footer = () => {
  return (
    <Flex
      as="footer"
      align="center"
      justify="space-between"
      bg="blackAlpha.300"
      color="white"
      p={6}
    >
      <Text fontSize="sm">
        Made with{' '}
        <span role="img" aria-label="love">
          💖
        </span>{' '}
        by SaidBySolo
      </Text>
      <Text fontSize="sm">
        <a
          href="https://github.com/Hitomi-Downloader-extension/chrome-extension"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>
      </Text>
    </Flex>
  );
};

const Loading = ({ text = '' }: { text: string }) => {
  return (
    <Flex justify="center" align="center" direction="column" height="100%">
      <Spinner margin="5px" />
      <Text size="16px">{text}</Text>
    </Flex>
  );
};

const CompatMode = ({ checkFunc }: { checkFunc: () => Promise<void> }) => {
  return (
    <>
      <Alert status="warning">
        <AlertIcon />
        Couldn't connect with Hitomi Downloader :(
      </Alert>
      <Flex direction="column" height="100%">
        <Flex
          justify="center"
          align="center"
          flexDirection="column"
          height="400px"
        >
          <Text fontSize="md">But that's ok. I'll use compatibility mode.</Text>
          <Text fontSize="sm">
            Please turn on HTTP API for a better experience.
          </Text>
          <Text fontSize="sm">
            ( Options -{'>'} Preferences -{'>'} Advanced -{'>'} HTTP API )
          </Text>
          <Button
            margin="5px"
            onClick={() => {
              chrome.tabs.query(
                { active: true, currentWindow: true },
                (tabs) => {
                  window.open('hitomi://' + tabs[0].url);
                },
              );
            }}
          >
            Download currunt page
          </Button>
        </Flex>
        <Flex>
          <Button
            margin="10px"
            onClick={() => {
              checkFunc();
            }}
          >
            Reload
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

const ExtendMode = ({ version }: { version: string }) => {
  const toast = useToast();

  const [valid, setValid] = useState(false);
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');

  const [downloadRequesting, setDownloadRequesting] = useState(false);
  const [cookieRequesting, setCookieRequesting] = useState(false);

  const fetchHitomiDownloaderValidUrl = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const response = await fetch(api + '/types', {
        method: 'POST',
        body: JSON.stringify({ input: tabs[0].url }),
      });
      if (response.status === 200) {
        const data = await response.json();
        if (tabs[0].url) {
          if (data['types'].length === 0) {
            return setValid(false);
          }
          setUrl(tabs[0].url);
          setType(data['types'][0]);
          setValid(true);
        }
      }
    });
  };

  const requestHitomiDownloaderDownload = async () => {
    setDownloadRequesting(true);
    const response = await fetch(api + '/download', {
      method: 'POST',
      body: JSON.stringify({ input: url }),
    });
    if (response.status === 200) {
      setDownloadRequesting(false);
      toast({
        title: 'Download has been requested!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateHitomiDownloaderCookies = async () => {
    setCookieRequesting(true);
    chrome.cookies.getAll({ url: url }, async (cookies) => {
      const parsed: object[] = [];
      cookies.forEach((cookie) => {
        parsed.push({
          domain: cookie.domain,
          expires: cookie.expirationDate,
          name: cookie.name,
          value: cookie.value,
          path: cookie.path,
        });
      });
      const response = await fetch(api + '/update_cookies', {
        method: 'POST',
        body: JSON.stringify({ cookies: parsed }),
      });

      if (response.status === 200) {
        setCookieRequesting(false);
        toast({
          title: 'Cookies have been updated!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setCookieRequesting(false);
        toast({
          title: 'Failed to update cookies!',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        console.log(`err: ${response.status}`);
        console.log(`resp: ${response.text()}`);
      }
    });
  };

  useEffect(() => {
    fetchHitomiDownloaderValidUrl();
  }, []);

  return (
    <>
      {valid ? (
        <Alert status="success">
          <AlertIcon />
          You can download {type}
        </Alert>
      ) : (
        <Alert status="error">
          <AlertIcon />
          Invalid URL
        </Alert>
      )}
      <Flex direction="column" height="100%">
        <Flex
          flexDirection="column"
          justifyContent="center"
          align="center"
          height="400px"
        >
          <Button
            isLoading={!!downloadRequesting}
            isDisabled={!url}
            onClick={() => requestHitomiDownloaderDownload()}
            margin="5px"
          >
            Download currunt page
          </Button>
          <Button
            isLoading={!!cookieRequesting}
            isDisabled={!url}
            onClick={() => updateHitomiDownloaderCookies()}
            margin="5px"
          >
            Load (Update) cookies
          </Button>
        </Flex>
        {/* <Flex margin="5px">Hitomi Downloader Version: {version}</Flex> */}
      </Flex>
    </>
  );
};

const App = () => {
  const [checking, setCheking] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [extensionVersion, setextensionChecking] = useState('');
  const [version, setVersion] = useState('');

  const checkExtensionNewVersion = async () => {
    const response = await fetch(
      'https://api.github.com/repos/Hitomi-Downloader-extension/chrome-extension/releases',
    );
    const data = await response.json();
    if (data[0].tag_name != chrome.runtime.getManifest().version) {
      setextensionChecking(data[0].tag_name);
      return;
    }
  };

  const checkHitomiDownloaderHTTPAPIIsEnabled = async () => {
    setCheking(true);
    try {
      const response = await fetch(api + '/version');
      if (response.status === 200) {
        setCheking(false);
        setIsEnabled(true);
        setVersion((await response.json())['version']);
        console.log(`Hitomi Downloader version: ${version}`);
        return;
      }
    } catch {
      setCheking(false);
      setIsEnabled(false);
      return;
    }
    setCheking(false);
    setIsEnabled(false);
    return;
  };
  useEffect(() => {
    console.log(`version: ${chrome.runtime.getManifest().version}`);
    checkHitomiDownloaderHTTPAPIIsEnabled();
    checkExtensionNewVersion();
  }, []);
  return (
    <>
      <Container height="400px" width="500px" padding="0px" maxHeight="100vh">
        <Center as="header">
          <Heading size="lg" margin="10px">
            Hitomi Downloader extension
          </Heading>
        </Center>
        {extensionVersion !== '' ? (
          <Alert status="warning" margin={0}>
            <AlertIcon />
            <Text>
              New version released!{' '}
              <Link
                color="teal.500"
                onClick={() =>
                  window.open(
                    `https://github.com/Hitomi-Downloader-extension/chrome-extension/releases/tag/${extensionVersion}`,
                  )
                }
              >
                Download {extensionVersion}
              </Link>
            </Text>
          </Alert>
        ) : null}
        {checking ? (
          <Loading text="Checking HTTP API was enabled..." />
        ) : isEnabled ? (
          <ExtendMode version={version} />
        ) : (
          <CompatMode checkFunc={checkHitomiDownloaderHTTPAPIIsEnabled} />
        )}
        <Footer />
      </Container>
    </>
  );
};

export default App;
