import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { observable, computed, action, runInAction } from 'mobx';
import {persist} from 'mobx-persist'
import FontIcon from 'material-ui/FontIcon';
// import TextField from 'material-ui/TextField';
// import RaisedButton from 'material-ui/RaisedButton';
// import CircularProgress from 'material-ui/CircularProgress';
import {accountService} from "../../services/account";
import Storage from '../../utils/storage';
import { Form, Icon, Input, Button, Modal } from 'antd';
import {ToastStore} from "../../components/Toast";



// const FormItem = Form.Item;



class LoginState {
  @observable username = '';
  @observable password = '';
  @computed get validated() {
    const {username, password} = this;
    const nameValidated = username.trim().length > 1;
    const passwordValidated = password.trim().length > 5 && password.trim().length <= 20;
    return (nameValidated && passwordValidated);
  }
  @persist('object') @observable error = {
    username: '',
    password: '',
  };
  @observable toastMessage = '';
  @observable submitting = false;
}

@inject('user')
@observer
@Form.create()
export default class Login extends React.Component {
  static store = new LoginState();
  state = {
    submitting: false,
  }
  @action handleSubmit = async(e) => {
    e.preventDefault();
    const _self = this;
    this.props.form.validateFields(async (err, values) => {
      if (!err) {
        if(_self.state.submitting) return;
        _self.setState({ submitting: true });
        const { username, password } = Login.store;
        try {
          const resp = await accountService.login(username, password);
          runInAction('action after xhrrequest', async() => {
            if (resp.code === '0') {
              const token = resp.data.access_token;
              const userData = await accountService.getProfile(resp.data.access_token);
              if (userData.code === '0') {
                const account = {account: username, password};
                _self.props.user.login(token, userData.data, account);
                _self.props.history.replace('/dashboard/main');
                return;
              } else {
                Modal.warning({
                  content: '登录失败, 请稍后重试'
                })
              }
            } else if (resp.msg) {
               Modal.warning({
                 content: resp.msg,
               })
            } else {
              Modal.warning({
                content: '登录失败, 请稍后重试'
              })
            }
          });
        } catch(err) {
          console.log(err);
        } finally {
          _self.setState({ submitting: false });
        }
      }
    });
  }
  login = async (e) => {
    e.preventDefault();
    if (this.state.submitting) return;
    this.setState({ submitting: true });
    const {username, password} = this.state;
    try {
      const resp = await accountService.login(username, password);
      if (resp.code === '0') {
        const token = resp.data.access_token;
        const userData = await accountService.getProfile(resp.data.access_token);
        if (userData.code === '0') {
          const account = {account: username, password};
          this.props.user.login(token, userData.data, account);
          this.props.history.replace('/dashboard/main');
          return;
        } else {
          ToastStore.show('登录失败, 请稍后重试');
        }
      } else if (resp.msg) {
        ToastStore.show(resp.msg);
      } else {
        ToastStore.show('登录失败, 请稍后重试');
      }
    } catch (e) {
      console.log(e, 'login');
      ToastStore.show('抱歉，发生未知错误，请稍后重试');
    }
    this.setState({ submitting: false });
  };

  render() {
    if (this.props.user.isLoggedIn) {
      return (<Redirect to={'/dashboard/main'}/>);
    }
    const {submitting} = this.state;
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="layout layout-login">
        <div className="title">
          <FontIcon className="material-icons">home</FontIcon>
          <Link to='/' className="title-txt">BizLink</Link>
        </div>
        <div className="card">
          <Form onSubmit={this.handleSubmit} className="login-form">
            <Form.Item>
              {getFieldDecorator('userName', {
                rules: [{ required: true, message: '请输入用户名' }],
              })(
                <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="请输入用户名"
                       onChange={(e) => Login.store.username = e.target.value} />
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('password', {
                rules: [{ required: true, message: '请输入密码' }],
              })(
                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password"
                       onChange={(e) => Login.store.password = e.target.value}/>
              )}
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button"
                      loading={submitting} disabled={!Login.store.validated}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}


