import React from 'react';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import FontIcon from 'material-ui/FontIcon';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import {accountService, AccountType} from "../../services/account";
import Toast, {ToastStore} from "../../components/Toast";

@inject('user')
@observer
export default class Register extends React.Component {
  state={
    username: '',
    password: '',
    account: '',
    verify_code: '',
    error: {
      account: '',
      username: '',
      password: '',
      verify_code: '',
    },
    submitting: false,
    type: AccountType.MOBILE,
  };
  get validated() {
    const {account, username, password, verify_code, error, type} = this.state;
    const nameValidated = username.trim().length > 0;
    const accountValidated = account.trim().length > 0;
    const passwordValidated = password.trim().length > 5 && password.trim().length <= 20;
    const codeValidated = ((type === AccountType.MAIL) && !!verify_code) || (type === AccountType.MOBILE);
    let errorCount = 0;
    Object.keys(error).forEach(key => {
      if (error[key] && error[key].length) errorCount++;
    });
    return (accountValidated && nameValidated && passwordValidated && codeValidated && (errorCount <= 0));
  }

  checkName = () => {
    const {username} = this.state;
    const error = {...this.state.error, username: ''};
    if (!(username.trim() || username)) {
      error.username = '用户名不能为空';
    } else if(username.trim().length < 1) {
      error.username = '用户名不能少于1个字';
    } else {
      if (this.state.error.username.length) this.setState({ error });
      return;
    }
    this.setState({ error });
  };

  checkAccount = () => {
    const {account, type} = this.state;
    const regMail = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    const error = {...this.state.error, account: ''};
    if (!(account.trim() || account)) {
      error.account = '账号不能为空';
    } else if ((type === AccountType.MAIL) && !regMail.test(account)) {
      error.account = '请使用有效的邮箱地址'
    } else if ((type === AccountType.MOBILE) && account.length !== 11) {
      error.account = '请使用有效的手机号'
    } else {
      if (this.state.error.account.length) this.setState({error});
      if (!error.account.length) {
        if (type === AccountType.MOBILE) {
          this.onReqCheckMobile(account);
        } else {
          this.onReqCheckMail(account);
        }
      }
      return;
    }
    this.setState({error});
  };

  onReqCheckMail = async () => {
    const {account, error} = this.state;
    try {
      const resp = await accountService.checkMail(account);
      if (resp.code !== 0) {
        error.account = resp.msg || '';
        this.setState({error});
      }
    } catch (e) {
      console.log(e, 'on req check mail');
    }
  };

  onReqCheckMobile = async () => {
    const {account, error} = this.state;
    try {
      const resp = await accountService.checkMobile(account);
      if (resp.code !== 0) {
        error.account = resp.msg || '';
        this.setState({error});
      }
    } catch (e) {
      console.log(e, 'on req check mobile');
    }
  };

  checkPassword = () => {
    const {password} = this.state;
    const error = {...this.state.error, password: ''};
    if (!(password.trim() || password)) {
      error.password = '密码不能为空';
    } else if(password.trim().length < 6) {
      error.password = '密码不能少于6位';
    } else {
      if (this.state.error.password.length) this.setState({ error });
      return;
    }
    this.setState({ error });
  };

  checkVerify = () => {
    const {verify_code} = this.state;
    const error = {...this.state.error, verify_code: ''};
    if (!verify_code) {
      error.verify_code = '验证码不能为空';
    } else {
      if (this.state.error.verify_code.length) this.setState({ error });
      return;
    }
    this.setState({ error });
  };

  register = async (e) => {
    e.preventDefault();
    if (this.state.submitting) return;
    this.setState({ submitting: true });
    const {account, username, password, verify_code} = this.state;
    try {
      const resp = await accountService.register(account, username, password, verify_code);
      if (resp.code === '0') {
        const loginResp = await accountService.login(account, password);
        const token = loginResp.data.access_token;
        const userData = await accountService.getProfile(loginResp.data.access_token);
        // this.props.login(userData.data, token, {account, password});
        // const data = {user: userData.data, token, account: {account, password}};
        // localStorage.setItem('bizUser', JSON.stringify(data));
        this.props.user.login(token, userData.data, {account, password});
        this.props.history.replace('/dashboard/main');
        return;
      }
      else ToastStore.show('注册失败, 请稍后重试');
    } catch (e) {
      console.log(e, 'register');
      ToastStore.show('抱歉，发生未知错误，请稍后重试');
    }
    this.setState({ submitting: false });
  };

  render() {
    const { account, username, password, error, submitting, type, verify_code } = this.state;
    return (
      <div className="layout register-view">
        <div className="title">
          <FontIcon className="material-icons">home</FontIcon>
          <Link to='/' className="title-txt">BizLink</Link>
        </div>
        <div className="card">
          <h4>注册</h4>
          <from onSubmit={this.register} className="form-login">
            <div style={{position: 'relative', overflow: 'visible'}}>
              <TextField
                hintText={`请输入${type === AccountType.MAIL ? '邮箱地址' : '手机号'}`}
                value={account}
                type={type === AccountType.MAIL ? 'email' : 'number'}
                onBlur={this.checkAccount}
                onChange={e => this.setState({ account: e.target.value })}
                errorText={error.account}
                style={{marginTop: 20, display: 'inline-block'}}
                className="login-input"/>
              <SelectField
                floatingLabelText="账号类型"
                value={type}
                underlineStyle={{borderBottom: 'none'}}
                labelStyle={{fontSize: 14, color: '#3c7bd6'}}
                style={{width: 120, position: 'absolute', right: -125}}
                onChange={this.handleTypeChange}
              >
                <MenuItem value={AccountType.MOBILE} primaryText="手机号" />
                <MenuItem value={AccountType.MAIL} primaryText="邮箱" />
              </SelectField>
            </div>
            {type === AccountType.MAIL && (
              <SmsVerify
                parent={this}
                verifyCode={verify_code}
                error={error}
                account={account}
                type={type}
                checkVerify={this.checkVerify}
              />
            )}
            <TextField
              hintText="请输入用户名"
              value={username}
              type="text"
              onBlur={this.checkName}
              onChange={e => this.setState({ username: e.target.value })}
              errorText={error.username}
              className="login-input username"/>
            {/*<p style={{fontSize: 12, color: '#999'}}>（提示：请使用真实姓名，让同事和商业伙伴能找到您）</p>*/}
            <TextField
              hintText="请输入密码"
              value={password}
              type="password"
              onBlur={this.checkPassword}
              onChange={e => this.setState({ password: e.target.value })}
              errorText={error.password}
              className="login-input"/>
            <RaisedButton label={submitting ? null : "确认"} className="btn-login" primary={this.validated}
                          disabled={!this.validated} onClick={this.register}
                          icon={submitting ? <CircularProgress size={28}/> : null}/>
            <div className="actions">
              <Link to="/" className="link-register">返回</Link>
            </div>
          </from>
        </div>
        <Toast />
      </div>
    );
  }
  handleTypeChange = (event, index, type) => this.setState({type, account: ''});
}

class SmsVerify extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {countDown: 0, submitting: false};
  }
  render() {
    const {checkVerify, parent, verifyCode, error, account} = this.props;
    const {countDown} = this.state;
    return (
      <div style={{position: 'relative', overflow: 'visible'}}>
        <TextField
          hintText='验证码'
          value={verifyCode}
          type='number'
          onBlur={checkVerify}
          onChange={e => parent.setState({ verify_code: e.target.value })}
          errorText={error.verify_code}
          style={{display: 'inline-block'}}
          className="login-input"/>
        <RaisedButton
          label={countDown >= 1 ? `${countDown}秒后重新获取` : "获取验证码"}
          labelStyle={{padding: 0}}
          primary={false}
          disabled={!account || !!error.account || (countDown > 0 && countDown <= 60)}
          style={{width: 120, position: 'absolute', right: -125}}
          onClick={this.submit}
        />
      </div>
    );
  }
  submit = async () => {
    const {account, type} = this.props;
    const {countDown, submitting} = this.state;
    if (submitting || (countDown > 0 && countDown <= 60)) return;
    this.onCountDown();
    this.setState({submitting: true});
    try {
      const resp = await accountService.sendVerifyCode(account, type === AccountType.MOBILE ? AccountType.MOBILE : AccountType.MAIL);
      if (resp.code !== '0') {
        ToastStore.show(resp.msg|| '抱歉，发生未知错误，请稍后重试');
      } else {
        ToastStore.show('已发送验证码，请注意接收');
      }
    }
     catch (e) {
      console.log(e, 'send verify code');
      ToastStore.show('抱歉，发生未知错误，请稍后重试');
    }
    this.setState({submitting: false});
  }
  onCountDown = () => {
    let {countDown} = this.state;
    if (countDown === 0) {
      countDown = 60
    } else if (countDown === -1) {
      countDown = 0;
    } else {
      countDown--;
    }
    this.setState({countDown});
    if (countDown === 0) return;
    setTimeout(() => this.onCountDown(), 1000);
  }
}