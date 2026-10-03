import json

from odoo.tests.common import ChromeBrowser


_wait_code_ok_org = ChromeBrowser._wait_code_ok
_navigate_to_org = ChromeBrowser.navigate_to

def navigate_to(self, url, *args, **kwargs):
    self._websocket_request('Profiler.enable')
    self._websocket_request('Profiler.startPreciseCoverage', params={'detailed': True})
    url += ('?' if '?' not in url else '&') + 'debug=assets'
    return _navigate_to_org(self, url, *args, **kwargs)

def _wait_code_ok(self, *args, **kwargs):
    result = _wait_code_ok_org(self, *args, **kwargs)

    coverage = self._websocket_request('Profiler.takePreciseCoverage')
    if not coverage or not coverage["result"]:
        _logger.warning("No coverage collected")
        return result
    self._websocket_request('Debugger.enable')
    for script_coverage in coverage["result"]:
        if not script_coverage["url"]:
            self._logger.warning("ignoring script %s", script_coverage['scriptId'])
            continue
        with open(f"web_coverage.{coverage['timestamp']}.{script_coverage['scriptId']}.json", "w+") as coverage_file:
            coverage_file.write(json.dumps(script_coverage))
        # TODO: get source map, map coverage to source map locations in filesystem, generate coverage.xml
        try:
            source = self._websocket_request('Debugger.getScriptSource', params={'scriptId': script_coverage['scriptId']}, timeout=600)
        except:
            self._logger.exception("scriptId %s", script_coverage['scriptId'])
            continue
        with open(f"web_coverage.{coverage['timestamp']}.{script_coverage['scriptId']}.source.json", "w+") as script_file:
            script_file.write(source['scriptSource'])
    return result

ChromeBrowser._wait_code_ok = _wait_code_ok
ChromeBrowser.navigate_to = navigate_to
