import React from 'react';
import {observer, inject} from 'mobx-react';
import {computed, action, runInAction, extendObservable} from 'mobx';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import {grey400, darkBlack} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MerchantSvc from '../../../services/merchant';
import MailIcon from 'material-ui/svg-icons/content/mail';
import CircularProgress from 'material-ui/CircularProgress';
import {ToastStore as Toast} from "../../../components/Toast";

class applyMessageStore {
  constructor() {
    extendObservable(this, {
      messages: [],
      DS: computed(() => this.messages.filter(m => !m.accept)),
      loading: false,
      landed: false,
    });
  }
  load = action(async (id) => {
    if (this.loading) return;
    this.loading = true;
    try {
      const resp = await MerchantSvc.getUserListByApply(id);
      runInAction('after load', () => {
        if (resp.code === '0' && resp.data) this.messages = [...resp.data];
      });
    } catch (e) {
      console.log(e, 'load invite message');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  });

  serviceType = {
    ACCEPT: 'accept',
    REFUSE: 'refuse',
  };

  applyAction = action(async (id, type) => {
    if (this.submitting || !id) return;
    this.submitting = true;
    try {
      let service = null;
      switch (type) {
        default: return;
        case this.serviceType.ACCEPT: service = MerchantSvc.acceptUserApply; break;
        case this.serviceType.REFUSE: service = MerchantSvc.refuseUserApply; break;
      }
      const resp = await service(id);
      console.log(resp, type);
      runInAction('after accept', () => {
        if (resp.code === '0') {
          this.messages = [...this.messages.filter(m => m.id !== id)];
          Toast.show(type === this.serviceType.ACCEPT ? '已同意该用户加入' : '已拒绝该用户加入');
        } else {
          Toast.show(resp.msg || '抱歉，提交失败，请稍后重试');
        }
      });
    } catch (e) {
      console.log(e, 'accept user apply');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.submitting = false;
  });
}

class inviteMessageStore {
  constructor() {
    extendObservable(this, {
      messages: [],
      DS: computed(() => this.messages.filter(m => !m.accept)),
      loading: false,
      landed: false,
    });
  }
  load = action(async (id) => {
    if (this.loading) return;
    this.loading = true;
    try {
      const resp = await MerchantSvc.getMerchantListByInvite(id);
      runInAction('after load', () => {
        if (resp.code === '0' && resp.data) this.messages = [...resp.data];
      });
    } catch (e) {
      console.log(e, 'load invite message');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  });

  serviceType = {
    ACCEPT: 'accept',
    REFUSE: 'refuse',
  };

  handleInviteAction = action(async (id, type) => {
    if (this.submitting || !id) return;
    this.submitting = true;
    try {
      let service = null;
      switch (type) {
        default: return;
        case this.serviceType.ACCEPT: service = MerchantSvc.acceptMerchantInvite; break;
        case this.serviceType.REFUSE: service = MerchantSvc.refuseMerchantInvite; break;
      }
      const resp = await service(id);
      runInAction('after accept', () => {
        if (resp.code === '0') {
          this.messages = [...this.messages.filter(m => m.id !== id)];
          Toast.show(type === this.serviceType.ACCEPT ? '已同意加入该商户' : '已拒绝加入该商户');
        } else {
          Toast.show(resp.msg || '抱歉，提交失败，请稍后重试');
        }
      });
    } catch (e) {
      console.log(e, 'handle invite error');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.submitting = false;
  });
}

const MessageType = {
  INVITE: 0,
  APPLY: 1,
};

const applyStore = new applyMessageStore();
const inviteStore = new inviteMessageStore();

export default class Message extends React.PureComponent {
  render() {
    return (
      <div className="search-content">
        <MessageList store={applyStore} type={MessageType.APPLY}/>
        <MessageList store={inviteStore} type={MessageType.INVITE}/>
        <div style={{flex: 1}}/>
      </div>
    );
  }
}

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="操作"
    tooltipPosition="bottom-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

@inject('user')
@observer
class MessageList extends React.Component {
  store = this.props.store;
  componentWillMount() {
    const {type} = this.props;
    const currentUser = this.props.user.user.current;
    if (!currentUser) return;
    this.store.load(type === MessageType.APPLY ? currentUser.mer_id : currentUser.id);
  }
  render() {
    const {DS, loading, serviceType, landed} = this.store;
    const {type} = this.props;
    const isInvite = type === MessageType.INVITE;
    const serviceAction = isInvite ? this.store.handleInviteAction : this.store.applyAction;

    let headerTxt = '';
    let messageTip = '';
    let primaryTxtTip = '';
    switch (type) {
      default: return;
      case MessageType.INVITE:
        headerTxt = '商户邀请';
        messageTip = '邀请加入商户';
        primaryTxtTip = '商户';
        break;
      case MessageType.APPLY:
        headerTxt = '用户申请';
        messageTip = '申请加入商户';
        primaryTxtTip = '用户';
        break;
    }

    return (
      <List className='search-list'>
        <div style={{backgroundColor: '#FFF'}}>
          <Subheader >{headerTxt}</Subheader>
          {loading && !landed && <CircularProgress size={28} style={{display: 'block', margin: '0 auto 20px auto'}}/>}
          {!DS.length && !loading && <p className="none-data" style={{textAlign: 'center'}}>暂无内容</p>}
          {(DS.length > 0) && <Divider inset={true} />}
        </div>
        <div className='list-container'>
          {
            DS.map((item, index) => (
              <div key={index} style={{backgroundColor: '#FFF'}}>
                <ListItem
                  leftIcon={<MailIcon />}
                  rightIconButton={(
                    <IconMenu iconButtonElement={iconButtonElement}>
                      <MenuItem onTouchTap={() => serviceAction(item.id, serviceType.ACCEPT)}>同意</MenuItem>
                      <MenuItem onTouchTap={() => serviceAction(item.id, serviceType.REFUSE)}>拒绝</MenuItem>
                    </IconMenu>
                  )}
                  primaryText={`${primaryTxtTip}: ${isInvite ? item.mer_name : item.name}`}
                  secondaryText={
                    <p>
                      <span style={{color: darkBlack}}>{messageTip}</span><br />
                      {item.create_time}
                    </p>
                  }
                  secondaryTextLines={2}
                />
                {((DS.length - 1) !== index) && <Divider inset={true} />}
              </div>
            ))
          }
        </div>
      </List>
    );
  }
}
