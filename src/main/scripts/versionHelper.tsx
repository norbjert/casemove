import axios from 'axios';
import { GithubResponse } from 'main/interfaces/mainInterfaces';


async function getGithubVersion(platform: string): Promise<GithubResponse> {
  return new Promise((resolve) => {
    axios
      .get('https://api.github.com/repos/norbjert/casemove/releases')
      .then((response) => {
        const responseData: JSON = response.data;

        for (const [_key, value] of Object.entries(responseData)) {
          if (value.prerelease == false) {
            let downloadLink: string = value['html_url'];

            // Find the relevant download link
            switch (platform) {
              case 'win32':
                value.assets.forEach(
                  (element: { name: string; browser_download_url: string }) => {
                    if (
                      element.name.includes('.exe') &&
                      !element.name?.toLowerCase()?.includes('blockmap')
                    ) {
                      downloadLink = element.browser_download_url;
                    }
                  },
                );
                break;

              case 'linux':
                value.assets.forEach(
                  (element: {
                    name: string | string[];
                    browser_download_url: string;
                  }) => {
                    if (element.name.includes('.AppImage')) {
                      downloadLink = element.browser_download_url;
                    }
                  },
                );
                break;

              default:
                break
            }

            resolve({
              version: parseInt(value.tag_name.replaceAll('.', '').replaceAll('v', '')),
              downloadLink: downloadLink,
            });
            break;
          }
        }
        // No releases found — resolve with current version (no update needed)
        resolve({ version: 0, downloadLink: '' });
      })
      .catch((_err) => {
        resolve({ version: 0, downloadLink: '' });
      });
  });
}

export { getGithubVersion };
