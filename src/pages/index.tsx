/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { LoadingOutlined, CopyFilled } from '@ant-design/icons';
import { Types } from 'aptos';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { aptosClient, faucetClient } from '../config/aptosClient';
import { AptosAccount } from 'aptos';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import '../Wallet.css';

const MainPage = () => {
  const [txLoading, setTxLoading] = useState({
    sign: false,
    signTx: false,
    transaction: false,
    faucet: false
  });
  const [txLinks, setTxLinks] = useState<string[]>([]);
  const {
    connect,
    disconnect,
    account,
    wallets,
    signAndSubmitTransaction,
    connecting,
    connected,
    disconnecting,
    wallet: currentWallet,
    network
  } = useWallet();

  const renderWalletConnectorGroup = () => {
    return wallets.map((wallet) => {
      const option = wallet.adapter;
      return (
        <Button
          onClick={() => {
            connect(option.name).then(() => {
              const elements = document.getElementsByClassName('modal-backdrop');
              console.log(elements);
              while (elements.length > 0) {
                elements[0].parentNode.removeChild(elements[0]);
              }
            });
          }}
          id={option.name.split(' ').join('_')}
          key={option.name}
          className="wallet-adapter-list d-flex align-items-center">
          <div className='w-100'>
            {option.name}
          </div>
          <div className='w-100 text-end connect-acordion'>Connect</div>
        </Button>
      );
    });
  };

  const transferToken = async () => {
    try {
      setTxLoading({
        ...txLoading,
        transaction: true
      });
      const txOptions = {
        max_gas_amount: '1000',
        gas_unit_price: '100'
      };
      if (account?.address || account?.publicKey) {
        const demoAccount = new AptosAccount();
        await faucetClient.fundAccount(demoAccount.address(), 0);
        const payload: Types.TransactionPayload = {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
          arguments: [
            demoAccount.address().hex(),
            ['Fewcha'].includes(currentWallet?.adapter?.name || '') ? 717 : '717'
          ]
        };
        const transactionRes = await signAndSubmitTransaction(payload, txOptions);
        await aptosClient.waitForTransaction(transactionRes?.hash || '');
        const links = [...txLinks, `https://explorer.devnet.aptos.dev/txn/${transactionRes?.hash}`];
        setTxLinks(links);
      }
    } catch (err: any) {
      console.log('tx error: ', err.msg);
    } finally {
      setTxLoading({
        ...txLoading,
        transaction: false
      });
    }
  };

  const renderContent = () => {
    if (connected && account) {
      return (
        <div className="dropdown wallet-network-bg">
          <span className='wallet-network'>{network.name}</span>
          <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="false" aria-expanded="false" style={{ borderRadius: '0.5rem' }}>
            {account?.address?.toString().slice(0, 10)}...
          </button>
          <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end p-2" style={{ transition: 'all 0.5s ease 0s' }}>
            <li><h5 className='text-white p-2'>{currentWallet?.adapter.name} Wallet</h5></li>
            <li><span className='p-3'>{account?.address?.toString().slice(0, 10)}... <CopyFilled className='wallet-copy' onClick={() => {
              navigator.clipboard.writeText(account?.address?.toString());
              alert('Copy to clipboard!');
            }} /></span></li>
            <li><span className='p-3'>{network.name}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <Button
                className='w-100'
                id="disconnectBtn"
                onClick={() => {
                  setTxLinks([]);
                  disconnect();
                }}>
                Disconnect
              </Button>
            </li>
          </ul>
        </div>
      );
    } else {
      return (
        <div>
          <div className="dropdown wallet-network-bg" style={{ borderRadius: '.5rem' }}>
            <button className="btn btn-secondary" type="button" data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-bs-auto-close="false" aria-expanded="false" style={{ borderRadius: '0.5rem' }}>
              Connect Wallet
            </button>
          </div>
          <div className="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">Connect your wallet</h1>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <div className="flex flex-col pb-2">{renderWalletConnectorGroup()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };
  return (
    <div>
      <div className="w-full h-[100vh] flex justify-center items-center">
        <div className="flex justify-center max-w-2xl">{renderContent()}</div>
      </div>
    </div>
  );
};

export default MainPage;
