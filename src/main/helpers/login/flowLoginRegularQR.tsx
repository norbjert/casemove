import log from 'electron-log';
import { EAuthTokenPlatformType, LoginSession } from 'steam-session';
import { LoginOptions } from '../../../shared/Interfaces.tsx/store';
import { storeRefreshToken } from '../classes/steam/settings';
import { emitterAccount } from '../../../emitters';

export async function flowLoginRegularQR(doStoreLogin: boolean): Promise<{
  responseStatus: keyof LoginOptions;
  session?: LoginSession;
}> {
  return new Promise(async (resolve) => {
    const session = new LoginSession(EAuthTokenPlatformType.SteamClient);

    session.on('remoteInteraction', () => {
      emitterAccount.emit('qrLogin:scanned');
    });

    session.on('authenticated', async () => {
      log.info(`Logged into Steam as ${session.accountName}`);

      if (doStoreLogin) {
        await storeRefreshToken(session.accountName, session.refreshToken);
      }

      resolve({
        responseStatus: 'loggedIn',
        session,
      });
    });

    session.once('timeout', () => {
      resolve({
        responseStatus: 'defaultError',
      });
    });

    session.once('error', (_err) => {
      log.error('QR login error');
      resolve({
        responseStatus: 'defaultError',
      });
    });
    try {
      emitterAccount.once('qrLogin:cancel', () => {
        session.removeAllListeners('authenticated');
        session.removeAllListeners('timeout');
        session.removeAllListeners('error');
        session.cancelLoginAttempt();
      });
      const { qrChallengeUrl } = await session.startWithQR();
      emitterAccount.emit('qrLogin:show', qrChallengeUrl);
    } catch {
      resolve({
        responseStatus: 'defaultError',
      });
    }
  });
}
