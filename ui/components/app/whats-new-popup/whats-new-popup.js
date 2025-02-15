import React, { useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getCurrentLocale } from '../../../ducks/metamask/metamask';
import { I18nContext } from '../../../contexts/i18n';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import { updateViewedNotifications } from '../../../store/actions';
import { getTranslatedUINoficiations } from '../../../../shared/notifications';
import { getSortedNotificationsToShow } from '../../../selectors';

function getActionFunctionById(id) {
  const actionFunctions = {
    2: () => {
      global.platform.openTab({
        url:
          'https://survey.alchemer.com/s3/6173069/MetaMask-Extension-NPS-January-2021',
      });
    },
    3: () => {
      global.platform.openTab({
        url: 'https://community.metamask.io/t/about-the-security-category/72',
      });
    },
  };

  return actionFunctions[id];
}

const renderFirstNotification = (notification, idRefMap) => {
  const { id, date, title, description, image, actionText } = notification;
  const actionFunction = getActionFunctionById(id);
  return (
    <div
      className={classnames(
        'whats-new-popup__notification whats-new-popup__first-notification',
      )}
      key={`whats-new-popop-notificatiion-${id}`}
      ref={idRefMap[id]}
    >
      {image && (
        <img
          className="whats-new-popup__notification-image"
          src={image.src}
          height={image.height}
          width={image.width}
        />
      )}
      <div className="whats-new-popup__notification-title">{title}</div>
      <div className="whats-new-popup__description-and-date">
        <div className="whats-new-popup__notification-description">
          {description}
        </div>
        <div className="whats-new-popup__notification-date">{date}</div>
      </div>
      {actionText && (
        <Button
          type="secondary"
          className="whats-new-popup__button"
          rounded
          onClick={actionFunction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

const renderSubsequentNotification = (notification, idRefMap) => {
  const { id, date, title, description, actionText } = notification;

  const actionFunction = getActionFunctionById(id);
  return (
    <div
      className={classnames('whats-new-popup__notification')}
      key={`whats-new-popop-notificatiion-${id}`}
      ref={idRefMap[id]}
    >
      <div className="whats-new-popup__notification-title">{title}</div>
      <div className="whats-new-popup__description-and-date">
        <div className="whats-new-popup__notification-description">
          {description}
        </div>
        <div className="whats-new-popup__notification-date">{date}</div>
      </div>
      {actionText && (
        <div className="whats-new-popup__link" onClick={actionFunction}>
          {actionText}
        </div>
      )}
    </div>
  );
};

export default function WhatsNewPopup({ onClose }) {
  const t = useContext(I18nContext);

  const notifications = useSelector(getSortedNotificationsToShow);
  const locale = useSelector(getCurrentLocale);

  const [seenNotifications, setSeenNotifications] = useState({});

  const popoverRef = useRef();

  const memoizedNotifications = useEqualityCheck(notifications);
  const idRefMap = useMemo(
    () =>
      memoizedNotifications.reduce(
        (_idRefMap, notification) => ({
          ..._idRefMap,
          [notification.id]: React.createRef(),
        }),
        {},
      ),
    [memoizedNotifications],
  );

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries, _observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const [id, ref] = Object.entries(idRefMap).find(([_, _ref]) =>
              _ref.current.isSameNode(entry.target),
            );

            setSeenNotifications((_seenNotifications) => ({
              ..._seenNotifications,
              [id]: true,
            }));

            _observer.unobserve(ref.current);
          }
        });
      },
      {
        root: popoverRef.current,
        threshold: 1.0,
      },
    );

    Object.values(idRefMap).forEach((ref) => {
      observer.observe(ref.current);
    });

    return () => {
      observer.disconnect();
    };
  }, [idRefMap, setSeenNotifications]);

  return (
    <Popover
      className="whats-new-popup__popover"
      title={t('whatsNew')}
      onClose={() => {
        updateViewedNotifications(seenNotifications);
        onClose();
      }}
      popoverRef={popoverRef}
      mediumHeight
    >
      <div className="whats-new-popup__notifications">
        {notifications.map(({ id }, index) => {
          const notification = getTranslatedUINoficiations(t, locale)[id];
          return index === 0
            ? renderFirstNotification(notification, idRefMap)
            : renderSubsequentNotification(notification, idRefMap);
        })}
      </div>
    </Popover>
  );
}

WhatsNewPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};
