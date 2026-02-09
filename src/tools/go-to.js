import { BrowserUtil, StorageUtil } from '../utils/browserUtil.js';
import {Helpers, URL_CONSTANTS} from '../utils/helperUtils.js';

(function (){
    'use strict';

    const goToAuthor = async function (currentTab) {
        const state = await BrowserUtil.getState();
        const contentPath = URL_CONSTANTS.authPrefix + Helpers.getPagePath(state) + ".html";
        const destinationUrl = state.domain.authorUrl + contentPath;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToPublish = async function(currentTab) {
        const state = await BrowserUtil.getState();
        const contentPath = Helpers.getMappedPagePath(state) + "/"
        const destinationUrl = state.domain.publishUrl + contentPath;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToAdobePublish = async function(currentTab) {
        const state = await BrowserUtil.getState();
        const contentPath = Helpers.getMappedPagePath(state) + "/"
        const destinationUrl = Helpers.buildDefaultAdobeCloudDomain("publish", state.domain.programId, state.domain.environmentId) + contentPath;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToDam = async function(currentTab) {
        const state = await BrowserUtil.getState();
        const path = "/assets.html/content/dam/paylocity";
        const destinationUrl = state.domain.authorUrl + path;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToProd = async function(currentTab) {
        const options = await StorageUtil.get();
        const destinationUrl = Helpers.buildDefaultAdobeCloudDomain("author", options.program_id, options.prod_env_id);
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToStage = async function(currentTab) {
        const options = await StorageUtil.get();
        const destinationUrl = Helpers.buildDefaultAdobeCloudDomain("author", options.program_id, options.stage_env_id);
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToDev = async function(currentTab) {
        const options = await StorageUtil.get();
        const destinationUrl = Helpers.buildDefaultAdobeCloudDomain("author", options.program_id, options.dev_env_id);
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToCloudManager = async function(currentTab) {
        const options = await StorageUtil.get();
        const destinationUrl = `https://experience.adobe.com/#/${options.program_name}/cloud-manager/home.html/program/${options.program_id}`;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToTarget = async function(currentTab) {
        const options = await StorageUtil.get();
        const destinationUrl = `https://experience.adobe.com/#/${options.program_name}/target/activities`;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    const goToAdminConsole = async function(currentTab) {
        const destinationUrl = `https://adminconsole.adobe.com`;
        currentTab ? BrowserUtil.updateUrl(destinationUrl) : BrowserUtil.newTab(destinationUrl);
    }

    async function init(button, currentTab) {
        if (button.id.startsWith("go-to-author")) {
            await goToAuthor(currentTab);
        } else if (button.id.startsWith("go-to-publish")) {
            await goToPublish(currentTab);
        } else if (button.id.startsWith("go-to-adobe-publish")) {
            await goToAdobePublish(currentTab);
        } else if (button.id.startsWith("go-to-dam")) {
            await goToDam(currentTab);
        } else if (button.id.startsWith("go-to-prod")) {
            await goToProd(currentTab);
        } else if (button.id.startsWith("go-to-stage")) {
            await goToStage(currentTab);
        } else if (button.id.startsWith("go-to-dev")) {
            await goToDev(currentTab);
        } else if (button.id.startsWith("go-to-cloud-manager")) {
            await goToCloudManager(currentTab);
        } else if (button.id.startsWith("go-to-target")) {
            await goToTarget(currentTab);
        } else if (button.id.startsWith("go-to-admin-console")) {
            await goToAdminConsole(currentTab);
        }
    }
    Helpers.registerToolButtons("go-to", init);
})();
