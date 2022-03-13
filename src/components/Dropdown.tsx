import { Icon, Icons } from "components/Icon";
import React, { Fragment } from "react";

import { Listbox, Transition } from "@headlessui/react";

export interface OptionItem {
  id: number;
  name: string;
}

interface DropdownProps {
  selectedItem: OptionItem;
  setSelectedItem: (value: OptionItem) => void;
  options: Array<OptionItem>;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (props: DropdownProps) => (
    <div className="relative my-4 w-72 ">
      <Listbox value={props.selectedItem} onChange={props.setSelectedItem}>
        {({ open }) => (
          <>
            <Listbox.Button className="bg-denim-500 focus-visible:ring-bink-500 focus-visible:ring-offset-bink-300 relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left text-white shadow-md focus:outline-none focus-visible:border-indigo-500  focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 sm:text-sm">
              <span className="block truncate">{props.selectedItem.name}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <Icon
                  icon={Icons.CHEVRON_DOWN}
                  className={`transform transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="bg-denim-500 scrollbar-thin scrollbar-track-denim-400 scrollbar-thumb-denim-200 absolute bottom-11 z-10 mt-1 max-h-60 w-72 overflow-auto rounded-md py-1 text-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:bottom-10 sm:text-sm">
                {props.options.map((opt) => (
                  <Listbox.Option
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-denim-400 text-bink-700" : "text-white"
                      }`
                    }
                    key={opt.id}
                    value={opt}
                  >
                    {opt.name}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
    </div>
  )
);
