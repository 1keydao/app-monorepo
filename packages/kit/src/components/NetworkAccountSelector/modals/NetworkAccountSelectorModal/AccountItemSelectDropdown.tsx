import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DialogManager, Divider, IconButton } from '@onekeyhq/components';
import type { IAccount, INetwork, IWallet } from '@onekeyhq/engine/src/types';
import BaseMenu from '@onekeyhq/kit/src/views/Overlay/BaseMenu';
import type {
  IBaseMenuOptions,
  IMenu,
} from '@onekeyhq/kit/src/views/Overlay/BaseMenu';

import backgroundApiProxy from '../../../../background/instance/backgroundApiProxy';
import { useAppSelector } from '../../../../hooks';
import useAppNavigation from '../../../../hooks/useAppNavigation';
import { useCopyAddress } from '../../../../hooks/useCopyAddress';
import { CreateAccountModalRoutes } from '../../../../routes/Modal/CreateAccount';
import { ManagerAccountModalRoutes } from '../../../../routes/Modal/ManagerAccount';
import { ModalRoutes, RootRoutes } from '../../../../routes/routesEnum';
import { refreshAccountSelector } from '../../../../store/reducers/refresher';
import AccountModifyNameDialog from '../../../../views/ManagerAccount/ModifyAccount';
import useRemoveAccountDialog from '../../../../views/ManagerAccount/RemoveAccount';

const AccountItemMenu: FC<
  IMenu & {
    onChange: (value: string) => void;
    showAllUsedAddressOption: boolean;
  }
> = ({ onChange, showAllUsedAddressOption, ...props }) => {
  const onPress = useCallback(
    (value: string) => {
      onChange?.(value);
    },
    [onChange],
  );

  const options = useMemo<IBaseMenuOptions>(
    () => [
      {
        id: 'action__copy_address',
        onPress: () => onPress('copy'),
        icon: 'Square2StackOutline',
      },
      {
        id: 'action__rename',
        onPress: () => onPress('rename'),
        icon: 'TagOutline',
      },
      {
        id: 'action__view_details',
        onPress: () => onPress('detail'),
        icon: 'DocumentTextOutline',
      },
      showAllUsedAddressOption && (() => <Divider my={1} />),
      showAllUsedAddressOption && {
        id: 'action__show_all_used_addresses',
        onPress: () => onPress('showAllUsedAddress'),
        icon: 'ListBulletMini',
      },
      () => <Divider my={1} />,
      {
        id: 'action__remove_account',
        onPress: () => onPress('remove'),
        icon: 'TrashOutline',
        variant: 'desctructive',
      },
    ],
    [onPress, showAllUsedAddressOption],
  );

  return (
    <BaseMenu
      options={options}
      {...props}
      menuWidth={showAllUsedAddressOption ? 261 : undefined}
    />
  );
};

function AccountItemSelectDropdown({
  account,
  wallet,
  network,
}: {
  account: IAccount;
  wallet: IWallet;
  network: INetwork | null | undefined;
}) {
  const navigation = useAppNavigation();
  const { dispatch } = backgroundApiProxy;
  const { goToRemoveAccount, RemoveAccountDialog } = useRemoveAccountDialog();
  const { copyAddress } = useCopyAddress({
    wallet,
    account,
    network,
  });
  const networks = useAppSelector((s) => s.runtime.networks);

  const [showAllUsedAddressOption, setShowAllUsedAddressOption] =
    useState(false);

  useEffect(() => {
    if (network?.id) {
      const networkSettings = networks.find(
        (i) => i.id === network.id,
      )?.settings;
      setShowAllUsedAddressOption(networkSettings?.showUsedAddress ?? false);
    }
  }, [network, networks]);

  // TODO refreshAccounts
  const refreshAccounts = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (...args: any[]) => {
      dispatch(refreshAccountSelector());
    },
    [dispatch],
  );

  const handleChange = useCallback(
    (value: string) => {
      switch (value) {
        case 'copy':
          setTimeout(() => {
            copyAddress(account.displayAddress || account.address);
          }, 150);
          break;
        case 'rename':
          DialogManager.show({
            render: (
              <AccountModifyNameDialog
                visible
                account={account}
                onDone={() => {
                  // TODO refreshAccounts
                  refreshAccounts(wallet?.id ?? '', network?.id ?? '');
                }}
              />
            ),
          });
          break;
        case 'detail':
          navigation.navigate(RootRoutes.Modal, {
            screen: ModalRoutes.ManagerAccount,
            params: {
              screen: ManagerAccountModalRoutes.ManagerAccountModal,
              params: {
                walletId: wallet?.id ?? '',
                accountId: account.id,
                networkId: network?.id ?? '',
                refreshAccounts: () =>
                  refreshAccounts(wallet?.id ?? '', network?.id ?? ''),
              },
            },
          });
          break;
        case 'remove':
          goToRemoveAccount({
            wallet,
            accountId: account.id,
            networkId: network?.id ?? '',
            callback: () =>
              refreshAccounts(wallet?.id ?? '', network?.id ?? ''),
          });
          break;
        case 'showAllUsedAddress':
          navigation.navigate(RootRoutes.Modal, {
            screen: ModalRoutes.CreateAccount,
            params: {
              screen: CreateAccountModalRoutes.BitcoinUsedAddress,
              params: {
                accountId: account.id,
                networkId: network?.id ?? '',
                walletId: wallet?.id ?? '',
              },
            },
          });
          break;

        default:
          break;
      }
    },
    [
      account,
      copyAddress,
      goToRemoveAccount,
      navigation,
      network?.id,
      refreshAccounts,
      wallet,
    ],
  );

  return (
    <>
      {/* TODO move to parent */}
      {RemoveAccountDialog}
      <AccountItemMenu
        onChange={handleChange}
        showAllUsedAddressOption={showAllUsedAddressOption}
      >
        <IconButton
          name="EllipsisVerticalMini"
          type="plain"
          circle
          hitSlop={8}
        />
      </AccountItemMenu>
    </>
  );
}

export { AccountItemSelectDropdown };
