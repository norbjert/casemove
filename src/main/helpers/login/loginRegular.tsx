import log from 'electron-log';
import { EAuthTokenPlatformType, LoginSession } from 'steam-session';
import { StartLoginSessionWithCredentialsDetails } from 'steam-session/dist/interfaces-external';
import { LoginOptions } from '../../../shared/Interfaces.tsx/store';
import { storeRefreshToken } from '../classes/steam/settings';

export async function flowLoginRegular(
  loginDetails: StartLoginSessionWithCredentialsDetails,
  doStoreLogin: boolean
): Promise<{
  responseStatus: keyof LoginOptions;
  refreshToken?: string;
}> {
  return new Promise(async (resolve) => {
    const session = new LoginSession(EAuthTokenPlatformType.SteamClient);
    session.on('authenticated', async () => {
      log.info(`Logged into Steam as authenticated - ${session.accountName}`);

      if (doStoreLogin) {
        await storeRefreshToken(session.accountName, session.refreshToken);
      }

      resolve({
        responseStatus: 'loggedIn',
        refreshToken: session.refreshToken,
      });
    });

    session.once('timeout', () => {
      resolve({
        responseStatus: 'defaultError',
      });
    });

    session.once('error', (err) => {
      log.error('Login error', err);
      resolve({
        responseStatus: 'defaultError',
      });
    });
    try {
      await session.startWithCredentials(loginDetails);
    } catch (e) {
      log.error(e);
      resolve({
        responseStatus: 'defaultError',
      });
    }
  });
}
