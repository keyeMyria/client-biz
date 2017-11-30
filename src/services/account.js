import axios from './index';

const login = async (uname, pwd) => {
  const resp = await axios.post(`/user_gateway/auth`, { uname, pwd });
  return resp.data;
};

const getProfile = async access_token => {
  const resp = await axios.post('/user_gateway/get_userinfo', { access_token }, { headers: { access_token }});
  return resp.data;
};

const register = async (account, name, pwd, verify_code) => {
  const resp = await axios.post('/user_gateway/register', {account, name, pwd, verify_code});
  return resp.data;
};

const refreshToken = async (refresh_token) => {
  const resp = await axios.post('/user_gateway/refresh', {refresh_token});
  return resp.data;
};

const checkMobile = async (mobile) => {
  const resp = await axios.post('/user_gateway/check_mobile', {mobile});
  return resp.data;
};

const checkMail = async (email) => {
  const resp = await axios.post('/user_gateway/check_email', {email});
  return resp.data;
};

export const AccountType = {
  MOBILE: 'mobile',
  MAIL: 'mail',
}

const sendVerifyCode = async (target, type) => {
  let url = '';
  let data = {};
  if (type === AccountType.MAIL) {
    url = '/user_gateway/send_email_verify_code';
    data = {email: target};
  } else if (type === AccountType.MOBILE) {
    url = '/user_gateway/send_verify_code';
    data = {mobile: target};
  }
  if (!url) return;
  const resp = await axios.post(url, data);
  return resp.data;
};

export const accountService = {
  login,
  register,
  getProfile,
  refreshToken,
  checkMobile,
  checkMail,
  sendVerifyCode,
};