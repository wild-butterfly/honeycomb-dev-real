import React, { createContext, useContext, useState, ReactNode } from "react";
import NewJobModal from "../components/NewJobModal"; // Yol doğruysa değiştirmen gerekmez

type NewJobModalContextType = {
  open: () => void;
};

const NewJobModalContext = createContext<NewJobModalContextType>({
  open: () => {},
});

export const useNewJobModal = () => useContext(NewJobModalContext);

type ProviderProps = {
  children: ReactNode;
  customers: any[];
  onAddCustomer: (customer: any) => void;
  onNewJobSubmit?: (job: any) => void;
};

export const NewJobModalProvider = ({
  children,
  customers,
  onAddCustomer,
  onNewJobSubmit,
}: ProviderProps) => {
  const [show, setShow] = useState(false);

  const handleSubmit = async (job: any) => {
    if (onNewJobSubmit) {
      await onNewJobSubmit(job);
    }
    setShow(false);
  };

  return (
    <NewJobModalContext.Provider value={{ open: () => setShow(true) }}>
      {children}
      <NewJobModal
        show={show}
        onClose={() => setShow(false)}
        onSubmit={handleSubmit}
        customersList={customers}
        onAddCustomer={onAddCustomer}
      />
    </NewJobModalContext.Provider>
  );
};
