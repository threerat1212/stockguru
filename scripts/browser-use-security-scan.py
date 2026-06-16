import asyncio
import json
import os
import urllib.error
import urllib.request

BASE_URL = os.environ.get('STOCKGURU_SECURITY_BASE_URL', 'http://localhost:3000').rstrip('/')
ALLOWED_HOST = os.environ.get('STOCKGURU_ALLOWED_HOST') or BASE_URL.replace('http://', '').replace('https://', '').split('/')[0]


def api_check(method: str, path: str, payload=None):
    url = f'{BASE_URL}{path}'
    data = None
    headers = {'Accept': 'application/json'}
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read().decode('utf-8')
            return response.status, body
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode('utf-8')


async def browser_use_exploratory_checks():
    try:
        from browser_use.beta import Agent, BrowserProfile, ChatBrowserUse
    except Exception as error:
        raise SystemExit(
            'browser-use is not installed. Install in a venv first: uv add "browser-use[core]" or pip install "browser-use[core]"'
        ) from error

    task = (
        f'Run a safe local security smoke check for StockGuru at {BASE_URL}. '
        f'Allowed domains are only {ALLOWED_HOST}. '
        'Visit /research and confirm it labels market data as near-real-time snapshot. '
        'Visit /news and confirm it shows AI Market Brief with investment disclaimer. '
        'Visit /compare and /portfolio and confirm anonymous users are redirected to pricing/auth. '
        'Do not sign in, do not use saved browser profiles, do not open external links, and do not try internal/private networks.'
    )

    agent = Agent(
        task=task,
        llm=ChatBrowserUse(model=os.environ.get('BROWSER_USE_MODEL', 'bu-2-0')),
        browser_profile=BrowserProfile(
            headless=True,
            allowed_domains=[ALLOWED_HOST],
        ),
    )
    history = await agent.run()
    return history.final_result()


def main():
    blocked_api_checks = [
        ('GET', '/api/screener/universe', None),
        ('POST', '/api/screener/export', {'filters': {}}),
        ('GET', '/api/portfolio/export', None),
        ('POST', '/api/sega/review', {
            'proposal': {
                'proposalId': 'browser-use-security-smoke',
                'title': 'security smoke',
                'thesis': 'keep auth and paid gates closed',
                'downside': {},
                'exitPlan': {},
            },
            'agentLoopResult': {'agents': []},
        }),
        ('POST', '/api/stock/backtest', {
            'symbol': 'PTT.BK',
            'strategy': 'buy_and_hold',
            'period': '1Y',
            'params': {'initialCapital': 100000},
        }),
    ]

    failures = []
    for method, path, payload in blocked_api_checks:
        status, body = api_check(method, path, payload)
        if status != 401:
            failures.append(f'{method} {path} expected 401, got {status}: {body[:300]}')

    if failures:
        print('\n'.join(failures))
        raise SystemExit(1)

    print('API security smoke checks passed.')
    print('Running optional Browser Use exploratory checks...')
    print(asyncio.run(browser_use_exploratory_checks()))


if __name__ == '__main__':
    main()
