type CallAPIOptions<FuncArgs> = {
  params: FuncArgs,
  setInProgress?: (state: boolean) => void;
  // onError400?: (errors: ModelFieldError[] | null | undefined) => void;
  onException?: (exception: any) => void;
  onResponseFail?: (error: any, code: number) => void;
};

type CallAPIRawFunction<T> = {
  raw: Response;
  value(): Promise<T>;
};

type CallAPIReturn<T> = {
  result?: T;
  error?: any;

  isSuccess: boolean;
  statusCode: number;
}

// C - extends BaseAPI
export const callAPI = async <TClient, TFuncArgs, TResult>(
  client: TClient,
  func: (params: TFuncArgs) => Promise<CallAPIRawFunction<TResult>>,
  options?: CallAPIOptions<TFuncArgs>
): Promise<CallAPIReturn<TResult>> => {
  const {
    params, setInProgress, onException, onResponseFail,
  } = options || {};

  let statusCode = 999;
  let error: any;
  let result: TResult | undefined;

  try {
    setInProgress?.(true);

    const response = await func.apply(client, [params]) as CallAPIRawFunction<TResult>;

    statusCode = response.raw.status;
    result = await response.value();
  } catch (ex) {
    if (ex instanceof Response) {
      const {status, headers} = ex;
      const contentType = headers.get("content-type");

      statusCode = status;

      if (contentType && contentType.indexOf("application/json") !== -1)
        error = await ex.json();
      else if (!contentType || contentType.indexOf("text/html") === -1)
        error = await ex.text();

      onResponseFail?.(error, statusCode);
    } else {
      error = ex;
      onException?.(ex);
    }

  } finally {
    setInProgress?.(false);
  }

  const isSuccess = !error && statusCode >= 200 && statusCode < 300;

  return {result, error, isSuccess, statusCode};
};
