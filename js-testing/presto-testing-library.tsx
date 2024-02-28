import { render, renderHook, RenderHookOptions, RenderOptions } from '@testing-library/react';
import React, { ReactElement, StrictMode } from 'react';

function Wrapper({ children }) {
    return <StrictMode>{children}</StrictMode>;
}

function customRender(ui: ReactElement, options?: RenderOptions) {
    return render(ui, { wrapper: Wrapper, ...options });
}

function customRenderHook<Result, Props>(
    render: (initialProps: Props) => Result,
    options?: RenderHookOptions<Props>
) {
    return renderHook<Result, Props>(render, { wrapper: Wrapper, ...options });
}

// re-export everything
export * from '@testing-library/react';

export { customRender as render };
export { customRenderHook as renderHook };
export { render as renderNoStrictMode };
