const awsconfig = {
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID,
            loginWith: {
                oauth: {
                    domain: import.meta.env.VITE_AWS_COGNITO_DOMAIN,
                    scopes: ['openid', 'email', 'profile'],
                    redirectSignIn: ['http://localhost:5173/'],
                    redirectSignOut: ['http://localhost:5173/'],
                    responseType: 'code'
                }
            }
        }
    }
};

export default awsconfig;
