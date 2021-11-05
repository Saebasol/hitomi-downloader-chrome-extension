import React, { useState, useEffect } from 'react';
import {
  Heading,
  Flex,
  Spinner,
  Text,
  Center,
  Container,
  Button,
  Link,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';

const api = 'http://localhost:6009';

const Loading = ({ text = '' }: { text: string }) => {
  return (
    <Flex justify="center" align="center" direction="column" height="100%">
      <Spinner margin="5px" />
      <Text size="16px">{text}</Text>
    </Flex>
  );
};

const CompatMode = () => {
  return (
    <>
      <Alert status="warning" margin="0px">
        <AlertIcon />
        Couldn't connect with Hitomi Downloader :(
      </Alert>
      <Flex justify="center" align="center" direction="column" height="100%">
        <Text fontSize="md">But that's ok. I'll use compatibility mode.</Text>
        <Text fontSize="sm">
          Please{' '}
          <Link
            color="teal.500"
            onClick={() =>
              window.open(
                'https://github.com/Hitomi-Downloader-extension/api/releases',
              )
            }
          >
            apply this extension
          </Link>{' '}
          for a better experience.
        </Text>
        <Button
          margin="5px"
          onClick={() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              window.open('hitomi://' + tabs[0].url);
            });
          }}
        >
          Download currunt page
        </Button>
      </Flex>
    </>
  );
};

const ExtendMode = () => {
  const toast = useToast();

  const [valid, setValid] = useState(false);
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');

  const [downloadRequesting, setDownloadRequesting] = useState(false);
  const [cookieRequesting, setCookieRequesting] = useState(false);

  const fetchHitomiDownloaderValidUrl = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const response = await fetch(api + '/valid_url', {
        method: 'POST',
        body: JSON.stringify({ gal_num: tabs[0].url }),
      });
      if (response.status === 200) {
        const data = await response.json();
        if (tabs[0].url) {
          setUrl(tabs[0].url);
          setType(data['type'][0]);
          setValid(true);
        }
      }
    });
  };

  const requestHitomiDownloaderdownload = async () => {
    setDownloadRequesting(true);
    const response = await fetch(api + '/download', {
      method: 'POST',
      body: JSON.stringify({ gal_num: url }),
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
      const response = await fetch(api + '/cookie', {
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
          <Heading size="md">You can download {type}</Heading>
        </Alert>
      ) : (
        <Alert status="error">
          <AlertIcon />
          <Heading size="md">Invalid URL</Heading>
        </Alert>
      )}
      <Flex justify="center" align="center" direction="column" height="100%">
        <Button
          isLoading={!!downloadRequesting}
          isDisabled={!url}
          onClick={() => requestHitomiDownloaderdownload()}
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
    </>
  );
};

const App = () => {
  const [checking, setCheking] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const fetchHitomiDownloaderScriptWasLoaded = async () => {
    setCheking(true);
    try {
      await fetch(api + '/ping');
    } catch {
      setCheking(false);
      setScriptLoaded(false);
      return;
    }
    setCheking(false);
    setScriptLoaded(true);
  };
  useEffect(() => {
    fetchHitomiDownloaderScriptWasLoaded();
  }, []);
  return (
    <>
      <Container height="400px" width="500px" padding="0px">
        <Center>
          <Heading size="lg" margin="10px">
            Hitomi Downloader extension
          </Heading>
        </Center>
        {checking ? (
          <Loading text="Cheking script is loaded..." />
        ) : scriptLoaded ? (
          <ExtendMode />
        ) : (
          <CompatMode />
        )}
        {scriptLoaded ? null : (
          <Button
            margin="10px"
            onClick={() => {
              fetchHitomiDownloaderScriptWasLoaded();
            }}
          >
            Reload
          </Button>
        )}
      </Container>
    </>
  );
};

export default App;
