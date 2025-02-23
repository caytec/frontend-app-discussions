import React, { useCallback, useEffect, useState } from 'react';

import { Editor } from '@tinymce/tinymce-react';
import { useLocation, useParams } from 'react-router-dom';
// TinyMCE so the global var exists
// eslint-disable-next-line no-unused-vars,import/no-extraneous-dependencies
import tinymce from 'tinymce/tinymce';

import { useIntl } from '@edx/frontend-platform/i18n';
import { ActionRow, AlertModal, Button } from '@edx/paragon';

import { MAX_UPLOAD_FILE_SIZE } from '../data/constants';
import messages from '../discussions/messages';
import { uploadFile } from '../discussions/posts/data/api';

import 'tinymce/plugins/code';
// Theme
import 'tinymce/themes/silver';
// Toolbar icons
import 'tinymce/icons/default';
// Editor styles
import 'tinymce/skins/ui/oxide/skin.css';
// importing the plugin js.
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/autosave';
import 'tinymce/plugins/codesample';
import 'tinymce/plugins/image';
import 'tinymce/plugins/imagetools';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/paste';
/* eslint import/no-webpack-loader-syntax: off */
// eslint-disable-next-line import/no-unresolved
import edxBrandCss from '!!raw-loader!sass-loader!../index.scss';
// eslint-disable-next-line import/no-unresolved
import contentCss from '!!raw-loader!tinymce/skins/content/default/content.min.css';
// eslint-disable-next-line import/no-unresolved
import contentUiCss from '!!raw-loader!tinymce/skins/ui/oxide/content.min.css';

/* istanbul ignore next */
const TinyMCEEditor = (props) => {
  // note that skin and content_css is disabled to avoid the normal
  // loading process and is instead loaded as a string via content_style
  const locationObj = useLocation();
  const { courseId, postId } = useParams();
  const [showImageWarning, setShowImageWarning] = useState(false);
  const intl = useIntl();
  const enableInContextSidebar = Boolean(new URLSearchParams(locationObj.search).get('inContextSidebar') !== null);

  /* istanbul ignore next */
  const setup = useCallback((editor) => {
    editor.ui.registry.addButton('openedx_code', {
      icon: 'sourcecode',
      onAction: () => {
        editor.execCommand('CodeSample');
      },
    });
    editor.ui.registry.addButton('openedx_html', {
      text: 'HTML',
      onAction: () => {
        editor.execCommand('mceCodeEditor');
      },
    });
  }, []);

  const uploadHandler = useCallback(async (blobInfo, success, failure) => {
    try {
      const blob = blobInfo.blob();
      const imageSize = blobInfo.blob().size / 1024;
      if (imageSize > MAX_UPLOAD_FILE_SIZE) {
        failure(`Images size should not exceed ${MAX_UPLOAD_FILE_SIZE} KB`);
        return;
      }
      const filename = blobInfo.filename();
      const { location } = await uploadFile(blob, filename, courseId, postId || 'root');
      const img = new Image();
      img.onload = () => {
        if (img.height > 999 || img.width > 999) { setShowImageWarning(true); }
      };
      img.src = location;
      success(location);
    } catch (e) {
      failure(e.toString(), { remove: true });
    }
  }, [courseId, postId]);

  const handleClose = useCallback(() => {
    setShowImageWarning(false);
  }, []);

  let contentStyle;
  // In the test environment this causes an error so set styles to empty since they aren't needed for testing.
  try {
    contentStyle = [contentCss, contentUiCss, edxBrandCss].join('\n');
  } catch (err) {
    contentStyle = '';
  }

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (enableInContextSidebar) {
      const checkToxDialogVisibility = () => {
        const toxDialog = document.querySelector('.tox-dialog');
        if (toxDialog) {
          toxDialog.style.alignSelf = 'start';
          toxDialog.style.marginTop = '50px';
        }
      };

      const observer = new MutationObserver(checkToxDialogVisibility);

      // Observe changes to the entire document
      observer.observe(document, { childList: true, subtree: true });

      // Clean up the observer when the component unmounts
      return () => {
        observer.disconnect();
      };
    }
  }, [enableInContextSidebar]);

  return (
    <>
      <Editor
        init={{
          skin: false,
          menubar: false,
          branding: false,
          paste_data_images: false,
          contextmenu: false,
          browser_spellcheck: true,
          a11y_advanced_options: true,
          autosave_interval: '1s',
          autosave_restore_when_empty: false,
          plugins: 'autoresize autosave codesample link lists image imagetools code emoticons charmap paste',
          toolbar: 'undo redo'
                      + ' | formatselect | bold italic underline'
                      + ' | link blockquote openedx_code image'
                      + ' | bullist numlist outdent indent'
                      + ' | removeformat'
                      + ' | openedx_html'
                      + ' | emoticons'
                      + ' | charmap',
          content_css: false,
          content_style: contentStyle,
          body_class: 'm-2 text-editor',
          convert_urls: false,
          relative_urls: false,
          default_link_target: '_blank',
          target_list: false,
          images_upload_handler: uploadHandler,
          setup,
        }}
        {...props}
      />
      <AlertModal
        title={intl.formatMessage(messages.imageWarningModalTitle)}
        isOpen={showImageWarning}
        onClose={handleClose}
        isBlocking
        footerNode={(
          <ActionRow>
            <Button variant="danger" onClick={handleClose}>
              {intl.formatMessage(messages.imageWarningDismissButton)}
            </Button>
          </ActionRow>
        )}
      >
        <p>
          {intl.formatMessage(messages.imageWarningMessage)}
        </p>
      </AlertModal>
    </>
  );
};

export default React.memo(TinyMCEEditor);
