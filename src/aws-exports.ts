import { getAppEnv } from './config/env';

const currentOrigin = window.location.origin;

const awsconfig = {
    Auth: {
        Cognito: {
            userPoolId: getAppEnv('VITE_AWS_COGNITO_USER_POOL_ID'),
            userPoolClientId: getAppEnv('VITE_AWS_COGNITO_CLIENT_ID'),
            loginWith: {
                oauth: {
                    domain: getAppEnv('VITE_AWS_COGNITO_DOMAIN'),
                    scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
                    redirectSignIn: [getAppEnv('VITE_COGNITO_REDIRECT_SIGN_IN') ?? `${currentOrigin}/social/callback`],
                    redirectSignOut: [getAppEnv('VITE_COGNITO_REDIRECT_SIGN_OUT') ?? `${currentOrigin}/`],
                    responseType: 'code'
                }
            }
        }
    }
};

export default awsconfig;