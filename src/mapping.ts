import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  Contract,
  Deposited,
  Withdrawn,
  WithdrawalRequested,
} from '../generated/Contract/Contract';
import { Deposit } from '../generated/schema';

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
  deposit.amount = event.params.balance;
  deposit.timestamp = event.block.timestamp;
  deposit.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  deposit.amount = event.params.balance;
  if (deposit.amount.isZero()) {
    deposit.timestamp = BigInt.fromI32(0);
  }
  let contract = Contract.bind(event.address);
  deposit.withdrawalRequestTimestamp = contract.withdrawalRequestsDates(event.params.sender, event.params.id);
  deposit.save();
}

export function handleWithdrawalRequested(event: WithdrawalRequested): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  deposit.withdrawalRequestTimestamp = event.block.timestamp;
  deposit.save();
}
