import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  Contract,
  Deposited,
  Withdrawn,
  WithdrawalRequested,
  FeeSet,
  WithdrawalLockDurationSet,
  WithdrawalUnlockDurationSet,
  TotalSupplyFactorSet,
  SigmoidParametersSet,
} from '../generated/Contract/Contract';
import { Deposit, CommonData, Action, User } from '../generated/schema';

function createAction(id: string, user: Bytes, depositId: BigInt, amount: BigInt, tipestamp: BigInt, type: string): void {
  let action = new Action(id);
  action.user = user;
  action.depositId = depositId;
  action.amount = amount;
  action.timestamp = tipestamp;
  action.type = type;
  action.save();
}

function updateTotalDepositedByUser(address: Bytes, oldDepositValue: BigInt, newDepositValue: BigInt): void {
  let id = address.toHexString();
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.address = address;
    user.totalDeposit = BigInt.fromI32(0);
  }
  user.totalDeposit = user.totalDeposit.minus(oldDepositValue).plus(newDepositValue);
  user.save();
}

export function handleDeposited(event: Deposited): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  if (deposit == null) {
    deposit = new Deposit(id);
    deposit.user = event.params.sender;
    deposit.depositId = event.params.id;
    deposit.amount = BigInt.fromI32(0);
    deposit.timestamp = BigInt.fromI32(0);
    deposit.withdrawalRequestTimestamp = BigInt.fromI32(0);
  }
  updateTotalDepositedByUser(event.params.sender, deposit.amount, event.params.balance);
  deposit.amount = event.params.balance;
  deposit.timestamp = event.block.timestamp;
  deposit.save();
  updateTotalDeposited(event.address);
  createAction(
    event.transaction.hash.toHex(),
    event.params.sender,
    event.params.id,
    event.params.amount,
    event.block.timestamp,
    'Deposit'
  );
}

export function handleWithdrawn(event: Withdrawn): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  updateTotalDepositedByUser(event.params.sender, deposit.amount, event.params.balance);
  deposit.amount = event.params.balance;
  if (deposit.amount.isZero()) {
    deposit.timestamp = BigInt.fromI32(0);
  }
  let contract = Contract.bind(event.address);
  deposit.withdrawalRequestTimestamp = contract.withdrawalRequestsDates(event.params.sender, event.params.id);
  deposit.save();
  updateTotalDeposited(event.address);
  createAction(
    event.transaction.hash.toHex(),
    event.params.sender,
    event.params.id,
    event.params.amount,
    event.block.timestamp,
    'Withdrawal'
  );
}

export function handleWithdrawalRequested(event: WithdrawalRequested): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  deposit.withdrawalRequestTimestamp = event.block.timestamp;
  deposit.save();
  createAction(
    event.transaction.hash.toHex(),
    event.params.sender,
    event.params.id,
    BigInt.fromI32(0),
    event.block.timestamp,
    'WithdrawalRequest'
  );
}

function getCommonDataEntity(): CommonData | null {
  let commonData = CommonData.load('common');
  if (commonData == null) {
    commonData = new CommonData('common');
    commonData.sigmoidParamA = BigInt.fromI32(0);
    commonData.sigmoidParamB = BigInt.fromI32(0);
    commonData.sigmoidParamC = BigInt.fromI32(0);
    commonData.fee = BigInt.fromI32(0);
    commonData.withdrawalLockDuration = BigInt.fromI32(0);
    commonData.withdrawalUnlockDuration = BigInt.fromI32(0);
    commonData.totalSupplyFactor = BigInt.fromI32(0);
    commonData.totalStaked = BigInt.fromI32(0);
  }
  return commonData;
}

function updateTotalDeposited(contractAddress: Address): void {
  let commonData = getCommonDataEntity();
  let contract = Contract.bind(contractAddress);
  commonData.totalStaked = contract.totalStaked();
  commonData.save();
}

export function handleFeeSet(event: FeeSet): void {
  let commonData = getCommonDataEntity();
  commonData.fee = event.params.value;
  commonData.save();
}

export function handleWithdrawalLockDurationSet(event: WithdrawalLockDurationSet): void {
  let commonData = getCommonDataEntity();
  commonData.withdrawalLockDuration = event.params.value;
  commonData.save();
}

export function handleWithdrawalUnlockDurationSet(event: WithdrawalUnlockDurationSet): void {
  let commonData = getCommonDataEntity();
  commonData.withdrawalUnlockDuration = event.params.value;
  commonData.save();
}

export function handleTotalSupplyFactorSet(event: TotalSupplyFactorSet): void {
  let commonData = getCommonDataEntity();
  commonData.totalSupplyFactor = event.params.value;
  commonData.save();
}

export function handleSigmoidParametersSet(event: SigmoidParametersSet): void {
  let commonData = getCommonDataEntity();
  commonData.sigmoidParamA = event.params.a;
  commonData.sigmoidParamB = event.params.b;
  commonData.sigmoidParamC = event.params.c;
  commonData.save();
}
