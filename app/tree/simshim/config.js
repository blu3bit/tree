const UPLOAD_INTERVAL_SECONDS = 20;

export const config = {

    // polling
    UPLOAD_INTERVAL_SECONDS,

    // quota
    //UPLOAD_QUOTA: 10,
    UPLOAD_QUOTA: 100000,
    UPLOAD_QUOTA_DEFAULT_GRACE: 10000,
    UPLOAD_QUOTA_RESET_EARNED_SECONDS: UPLOAD_INTERVAL_SECONDS,
    UPLOAD_QUOTA_RESET_GRACE_SECONDS: 4 * UPLOAD_INTERVAL_SECONDS,
    UPLOAD_QUOTA_MAX_AVAILABLE: 100,

    // poll
    POLL_INTERVAL_SECONDS: 50,
    //DOWNLOAD_MAX_CARDS: 4000,
    //DOWNLOAD_MAX_SCORES: 4000,
    DOWNLOAD_MAX_CARDS: 4,
    //DOWNLOAD_MAX_SCORES: 4,

    // factor less then zero will decrease the cost,
    // one is neutral,
    // above will increase the cost.
    UPLOAD_QUOTA_FACTOR_SCORES: 0,
    UPLOAD_QUOTA_FACTOR_CARD:   0,
    UPLOAD_QUOTA_FACTOR_SIGNER: 0,
    UPLOAD_QUOTA_FACTOR_ERROR:  0
    //UPLOAD_QUOTA_FACTOR_SCORES: 1,
    //UPLOAD_QUOTA_FACTOR_CARD: 1.2,
    //UPLOAD_QUOTA_FACTOR_SIGNER: 1,
    //UPLOAD_QUOTA_FACTOR_ERROR: 1.01

};

