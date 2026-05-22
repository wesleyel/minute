"use client";

import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { fromS } from "hh-mm-ss";
import { useAtom } from "jotai";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useMemo, useCallback, useRef } from "react";
import CountUp from "react-countup";
import { PiArrowsClockwise, PiCopy, PiSignOut, PiUserCircleDuotone } from "react-icons/pi";
import { totalDurationVisibleAtom } from "../../../app/store";
import { trpc } from "./TrpcProvider";

export const AccountMenu = () => {
  const t = useTranslations("components.AccountMenu");

  const [totalDurationVisible, setTotalDurationVisible] = useAtom(
    totalDurationVisibleAtom,
  );
  const currentUser = trpc.currentUser.getCurrentUser.useQuery();
  const apiTokenQuery = trpc.currentUser.getApiToken.useQuery();
  const regenerateApiTokenMutation =
    trpc.currentUser.regenerateApiToken.useMutation({
      onSuccess: () => {
        void apiTokenQuery.refetch();
      },
    });

  const [prevDuration, setPrevDuration] = useState<number>(0);
  const delayTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const totalTimeEntryDuration =
    trpc.totalTimeEntryDuration.getTotalTimeEntryDuration.useQuery();

  const totalDuration = useMemo(
    () => totalTimeEntryDuration.data ?? 0,
    [totalTimeEntryDuration],
  );

  const formattingFn = useCallback(
    (number: number) => fromS(number, "hh:mm:ss"),
    [],
  );

  const handleEnd = useCallback(() => {
    setPrevDuration(totalDuration);

    clearTimeout(delayTimer.current);
    delayTimer.current = setTimeout(() => {
      setTotalDurationVisible(false);
    }, 1500);
  }, [setPrevDuration, totalDuration, setTotalDurationVisible]);

  const handleSignOutButtonClick = useCallback(async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/sign-in" });
  }, []);

  const handleRegenerateApiToken = useCallback(() => {
    regenerateApiTokenMutation.mutate();
  }, [regenerateApiTokenMutation]);

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleCopyApiToken = useCallback(() => {
    if (!apiTokenQuery.data) return;
    void navigator.clipboard.writeText(apiTokenQuery.data).then(() => {
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [apiTokenQuery.data]);

  return (
    <div className="text-sm relative flex items-center">
      <Menu>
        {({ open }) => (
          <div>
            <Transition
              show={open || totalDurationVisible}
              enter="duration-200 ease-out"
              enterFrom="translate-y-3 opacity-0"
              enterTo="translate-y-0 opacity-100"
              leave="duration-300 ease-out"
              leaveFrom="translate-y-0 opacity-100"
              leaveTo="translate-y-3 opacity-0"
            >
              <MenuItems
                static
                className="absolute bottom-16 left-4 w-full outline-hidden mt-1"
              >
                <div className="w-56 rounded-sm border border-gray-300 bg-white text-sm drop-shadow-sm">
                  <div className="p-4 py-5">
                    <div className="text-center gap-1 flex-col">
                      <p className="text-sm text-gray-500">
                        {t("totalDuration")}
                      </p>
                      <p className="text-3xl font-light font-mono">
                        <CountUp
                          start={prevDuration}
                          end={totalDuration}
                          duration={1.5}
                          formattingFn={formattingFn}
                          onEnd={handleEnd}
                        />
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("apiToken")}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-mono text-gray-700 truncate flex-1">
                        {apiTokenQuery.data ?? t("noApiToken")}
                      </p>
                      <button
                        type="button"
                        title={t("copyApiToken")}
                        className="p-1 rounded-sm hover:bg-gray-200 shrink-0"
                        onClick={handleCopyApiToken}
                        disabled={!apiTokenQuery.data}
                      >
                        <PiCopy className={`text-base ${copied ? "text-green-500" : "text-gray-600"}`} />
                      </button>
                      <button
                        type="button"
                        title={t("regenerateApiToken")}
                        className="p-1 rounded-sm hover:bg-gray-200 shrink-0"
                        onClick={handleRegenerateApiToken}
                        disabled={regenerateApiTokenMutation.isPending}
                      >
                        <PiArrowsClockwise className="text-base text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="p-1 flex items-center w-full border-t border-gray-200">
                    <MenuItem>
                      <button
                        type="button"
                        className="px-4 cursor-pointer py-2 flex items-center w-full text-left gap-2 hover:bg-gray-200"
                        onClick={() => {
                          void handleSignOutButtonClick();
                        }}
                      >
                        <PiSignOut className="text-lg" />
                        {t("signOut")}
                      </button>
                    </MenuItem>
                  </div>
                </div>
              </MenuItems>
            </Transition>
            <MenuButton className="flex m-2 p-2 rounded-sm w-full items-center gap-2 hover:bg-gray-200">
              <PiUserCircleDuotone className="text-2xl text-green-500" />
              {currentUser.data?.name}
            </MenuButton>
          </div>
        )}
      </Menu>
    </div>
  );
};
