type CallAPIOptions<R> = {
  params: R,
  setInProgress?: (state: boolean) => void;
  // onError400?: (errors: ModelFieldError[] | null | undefined) => void;
  onException?: (title: string, message: string) => void;
  onResponseFail?: (code: number) => void;
};

// C - extends BaseAPI
export const callAPI = async <C, R, T>(
  client: C,
  func: (params: R) => Promise<T>,
  options: CallAPIOptions<R>
): Promise<T | undefined> => {
  const {
    params, setInProgress, onException, onResponseFail,
  } = options;

  let result: T | undefined = undefined;
  try {
    setInProgress?.(true);

    result = await func.apply(client, [params]);
  } catch (ex) {
    const title: string | null | undefined = "";
    let message: string | null | undefined = "";

    if (ex instanceof Response) {
      const {status, headers} = ex;
      const contentType = headers.get("content-type");

      let output: any;
      if (contentType && contentType.indexOf("application/json") !== -1)
        output = await ex.json();
      else if (!contentType || contentType.indexOf("text/html") === -1)
        message = await ex.text();

      if (typeof output === "object")
        message = output.message;

      onResponseFail?.(status);
    } else
      message = ex.message;

    onException?.(title, message);
  } finally {
    setInProgress?.(false);
  }

  return result;
};
