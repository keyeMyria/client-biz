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
      applyDS: computed(() => this.messages.filter(m => !m.accept)),
      loading: false,
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
          this.messages = [...this.messages.filter(m => m.id !== id)]
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
      inviteDS: computed(() => this.messages.filter(m => !m.accept)),
      loading: false,
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
      console.log(resp, type);
      runInAction('after accept', () => {
        if (resp.code === '0') {
          this.messages = [...this.messages.filter(m => m.id !== id)]
          Toast.show('已同意加入该商户');
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

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="操作"
    tooltipPosition="bottom-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

const MessageType = {
  INVITE: 0,
  APPLY: 1,
};


const MessageList = ({listData, loading, serviceAction, actionType, type}) => {
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
  const isInvite = type === MessageType.INVITE;
  return (
    <List className='search-list'>
      <div style={{backgroundColor: '#FFF'}}>
        <Subheader >{headerTxt}</Subheader>
        {loading && <CircularProgress size={28} style={{display: 'block', margin: '0 auto 20px auto'}}/>}
        {!(listData && listData.length) && !loading && <p className="none-data" style={{textAlign: 'center'}}>暂无内容</p>}
        {(listData && listData.length > 0) && <Divider inset={true} />}
      </div>
      <div className='list-container'>
        {
          listData && listData.map((item, index) => (
            <div key={index} style={{backgroundColor: '#FFF'}}>
              <ListItem
                leftIcon={<MailIcon />}
                rightIconButton={(
                  <IconMenu iconButtonElement={iconButtonElement}>
                    <MenuItem onTouchTap={() => serviceAction(item.id, actionType.ACCEPT)}>同意</MenuItem>
                    <MenuItem onTouchTap={() => serviceAction(item.id, actionType.REFUSE)}>拒绝</MenuItem>
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
              {(listData.length && ((listData.length - 1) !== index)) && <Divider inset={true} />}
            </div>
          ))
        }
      </div>
    </List>
  );
};

@inject('user')
@observer
export default class Message extends React.Component {
  // isAdmin = this.props.user.user.current && (this.props.user.user.current.is_admin === 1);
  // notJoinMerchant = !(this.props.user.user.current && this.props.user.user.current.mer_id);
  applyStore = new applyMessageStore();
  inviteStore = new inviteMessageStore();

  componentWillMount() {
    const currentUser = this.props.user.user.current;
    if (!this.props.user.user.current) return;
    this.applyStore.load(currentUser.mer_id);
    this.inviteStore.load(currentUser.id);
    // if (this.isAdmin) this.applyStore.load(currentUser.mer_id);
    // if (this.notJoinMerchant) this.inviteStore.load(currentUser.id);
  }

  render() {
    return (
      <div className="search-content">
        <MessageList listData={this.applyStore.applyDS} loading={this.applyStore.loading} type={MessageType.APPLY}
                     serviceAction={this.applyStore.applyAction} actionType={this.applyStore.serviceType}/>
        <MessageList listData={this.inviteStore.inviteDS} loading={this.inviteStore.loading} type={MessageType.INVITE}
                     serviceAction={this.inviteStore.handleInviteAction} actionType={this.inviteStore.serviceType}/>
        <div style={{flex: 1}}/>
      </div>
    );
  }
}